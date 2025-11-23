# Quick Reference: Flow การประเมิน
**ใช้สำหรับ:** อ้างอิงด่วนขณะพัฒนา

---

## 🎯 Core Logic (ต้องจำ!)

### 1. เงื่อนไขหลัก 4 ข้อ

```
✅ Rule 1: ส่งต่อปกติ (PERSK < 10)
   → ส่งไปประเมินที่ MGRPERNR ถัดไป

✅ Rule 2: หยุดที่ระดับ 10 (มีการประเมินแล้ว >= 2 ครั้ง)
   → evaluationCount >= 2 + nextManager.PERSK >= 10
   → ข้ามไป "ก่อนลำดับสุดท้าย" เลย

✅ Rule 3: บังคับประเมิน (ยังไม่มีการประเมิน)
   → evaluationCount < 2 + nextManager.PERSK >= 10
   → บังคับส่งไปประเมินที่ระดับ 10/11 ก่อน

✅ Rule 4: กรณีพิเศษ
   → ไม่มี PARENTORG หรือ ไม่มี MGRPERNR
   → ส่งเข้า "ก่อนลำดับสุดท้าย" ทันที
```

### 2. Visibility Rules

| ผู้ใช้ | เห็นผลงานจาก |
|--------|---------------|
| 👤 พนักงานทั่วไป | PARENTORG เดียวกันเท่านั้น |
| 👥 คณะกรรมการกลั่นกรอง | PARENTORG ของตัวเองเท่านั้น |
| 👑 คณะกรรมการลำดับสุดท้าย | **ทั้งหมด** |

---

## 📊 ข้อมูลสถิติสำคัญ

- **พนักงานทั้งหมด:** 8,915 คน
- **PARENTORG:** 166 กอง/เขต
- **ระดับ 10-11:** เพียง 62 คน (0.70%)
- **Chain เฉลี่ย:** 5.72 ขั้น
- **พนักงาน 98.23%** มีระดับ 10/11 ใน Chain

---

## 🔥 Code Snippets ที่ใช้บ่อย

### JavaScript: ตรวจสอบ Visibility

```javascript
function checkVisibility(evaluatorPernr, employeePernr) {
  const evaluator = getEmployee(evaluatorPernr);
  const employee = getEmployee(employeePernr);
  
  // ถ้าเป็นคณะกรรมการลำดับสุดท้าย → เห็นทั้งหมด
  if (isCommitteeMember(evaluatorPernr, 'FINAL')) {
    return true;
  }
  
  // ต้อง PARENTORG ตรงกัน
  return evaluator.PARENTORG === employee.PARENTORG;
}
```

### JavaScript: ส่งต่อผู้ประเมิน

```javascript
function sendToNextEvaluator(workResult) {
  const employee = workResult.employee;
  
  // 1. ตรวจสอบ PARENTORG
  if (!employee.PARENTORG) {
    return sendToPreFinalCommittee(workResult);
  }
  
  let currentMgr = employee.MGRPERNR;
  let count = workResult.evaluationCount;
  
  while (currentMgr) {
    const manager = getEmployee(currentMgr);
    
    // 2. ตรวจสอบระดับ
    if (manager.PERSK >= 10) {
      if (count >= 2) {
        // หยุดและส่งเข้าคณะกรรมการ
        return sendToPreFinalCommittee(workResult);
      } else {
        // บังคับประเมินที่ 10/11 ก่อน
        return sendToEvaluator(manager, workResult);
      }
    }
    
    // 3. ส่งต่อปกติ
    sendToEvaluator(manager, workResult);
    count++;
    currentMgr = manager.MGRPERNR;
  }
  
  // 4. ไม่มี manager แล้ว
  return sendToPreFinalCommittee(workResult);
}
```

### SQL: ดึงผลงานที่ต้องประเมิน (with Visibility)

```sql
-- สำหรับพนักงานทั่วไป / คณะกรรมการกลั่นกรอง
SELECT wr.*, e.ENAME, e.PARENTORG
FROM work_results wr
INNER JOIN employees e ON wr.employee_pernr = e.PERNR
WHERE wr.current_evaluator_pernr = :evaluator_pernr
  AND wr.status = 'PENDING'
  AND e.PARENTORG = (
    SELECT PARENTORG 
    FROM employees 
    WHERE PERNR = :evaluator_pernr
  );

-- สำหรับคณะกรรมการลำดับสุดท้าย
SELECT wr.*, e.ENAME, e.PARENTORG
FROM work_results wr
INNER JOIN employees e ON wr.employee_pernr = e.PERNR
WHERE wr.committee_stage = 'PRE_FINAL';
```

---

## ⚠️ Edge Cases ที่ต้องจัดการ

```javascript
// 1. Circular Reference
const visited = new Set();
while (currentMgr) {
  if (visited.has(currentMgr)) {
    console.error("Circular reference detected!");
    return sendToPreFinalCommittee(workResult);
  }
  visited.add(currentMgr);
  // ...
}

// 2. MGRPERNR ไม่มีในระบบ
const manager = getEmployee(currentMgr);
if (!manager) {
  console.error("Manager not found:", currentMgr);
  return sendToPreFinalCommittee(workResult);
}

// 3. ระดับพิเศษ (21, 31, 32)
if (manager.PERSK === 21 || manager.PERSK >= 31) {
  return sendToPreFinalCommittee(workResult);
}
```

---

## 📝 Checklist ก่อน Deploy

### Database
- [ ] Import ข้อมูลพนักงาน 8,915 คน
- [ ] สร้าง Indexes ทั้งหมด
- [ ] Validate MGRPERNR, PARENTORG
- [ ] Setup Backup

### Backend
- [ ] Function: `getChainOfCommand()`
- [ ] Function: `sendToNextEvaluator()`
- [ ] Function: `checkVisibility()`
- [ ] Test Cases: 5 cases หลัก
- [ ] Edge Cases: ทั้งหมด

### Frontend
- [ ] หน้าส่งผลงาน
- [ ] หน้ารายการประเมิน (with Filter)
- [ ] หน้าประเมินผลงาน
- [ ] Dashboard

### Testing
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Load Testing (8,915 users)

---

## 🔍 ตัวอย่าง Use Cases (แบบสั้น)

### Case 1: Chain สั้น
```
พนักงาน (PERSK: 8) 
→ หัวหน้า (PERSK: 8) ✓ ประเมิน
→ ผู้จัดการ (PERSK: 9) ✓ ประเมิน
→ [ไม่มี MGRPERNR] → "ก่อนลำดับสุดท้าย"
```

### Case 2: มีระดับ 10 + ประเมินแล้ว >= 2
```
พนักงาน (PERSK: 7)
→ หัวหน้า (PERSK: 8) ✓ ประเมิน 1
→ ผู้จัดการ (PERSK: 9) ✓ ประเมิน 2
→ [ถัดไปคือ PERSK: 10] → ข้ามไป "ก่อนลำดับสุดท้าย"
```

### Case 3: บังคับประเมินที่ 10/11
```
ผู้จัดการ (PERSK: 9, ยังไม่มีการประเมิน)
→ [ถัดไปคือ PERSK: 11] → บังคับประเมินก่อน ✓
→ "ก่อนลำดับสุดท้าย"
```

### Case 4: ไม่มี PARENTORG
```
พนักงาน (PARENTORG: NULL)
→ ส่งเข้า "ก่อนลำดับสุดท้าย" ทันที
```

---

## 🎨 Flow Diagram (ASCII)

```
พนักงานส่งผลงาน
        ↓
   มี PARENTORG?
    ↙         ↘
  ไม่มี        มี
    ↓           ↓
 คณะกรรมการ   ส่งไปประเมิน
              ตาม MGRPERNR
                 ↓
           ระดับถัดไป >= 10?
            ↙         ↘
          ใช่          ไม่
           ↓           ↓
    ประเมินแล้ว >= 2?  ส่งต่อปกติ
     ↙        ↘
   ใช่        ไม่
    ↓          ↓
  คณะกรรมการ  บังคับประเมิน
              ที่ 10/11
                ↓
            คณะกรรมการ
```

---

## 📞 ติดต่อ

- **Technical Lead:** [ชื่อ]
- **Project Coordinator:** [ชื่อ]

---

**Last Updated:** 23 November 2025
