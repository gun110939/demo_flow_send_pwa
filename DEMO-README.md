# Demo ระบบประเมินผลงาน

ระบบ Demo สำหรับการส่งและประเมินผลงานตามลำดับสายบังคับบัญชา

## วิธีการใช้งาน

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้งทั้งหมดพร้อมกัน
npm run install:all

# หรือติดตั้งแยก
cd backend && npm install
cd ../frontend/evaluation-app && npm install
```

### 2. รันระบบ

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server จะรันที่ http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend/evaluation-app
npm start
# Angular จะรันที่ http://localhost:4200
```

### 3. เปิดใช้งาน

เปิดเบราว์เซอร์ไปที่ http://localhost:4200

---

## Flow การใช้งาน Demo

### Step 1: Login
- เลือกพนักงานจากรายการตามประเภท
- สามารถเลือกได้หลาย role:
  - พนักงานทั่วไป (ระดับ 1-7)
  - หัวหน้างาน/ผู้จัดการ (ระดับ 8-9)
  - ผู้บริหาร (ระดับ 10+)
  - คณะกรรมการกลั่นกรอง
  - คณะกรรมการลำดับสุดท้าย

### Step 2: ส่งผลงาน (ในฐานะพนักงาน)
1. เข้าหน้า "ส่งผลงาน"
2. กรอกชื่อและรายละเอียดผลงาน
3. ดูลำดับการประเมินที่จะเกิดขึ้น
4. กดส่ง

### Step 3: ประเมินผลงาน (ในฐานะผู้ประเมิน)
1. Logout และเลือก Login เป็นผู้ประเมินตาม Chain
2. เข้าหน้า "รายการรอประเมิน"
3. เลือกผลงานที่ต้องการประเมิน
4. ให้ผล "อนุมัติ" หรือ "ไม่อนุมัติ"
5. ผลงานจะส่งต่อไปยังผู้ประเมินถัดไป

### Step 4: คณะกรรมการกลั่นกรอง
1. Login เป็นคณะกรรมการกลั่นกรอง
2. จะเห็นเฉพาะผลงานใน PARENTORG ของตัวเอง
3. ประเมินและให้คะแนน 1-100
4. ผลงานจะส่งไปยังลำดับสุดท้าย

### Step 5: คณะกรรมการลำดับสุดท้าย
1. Login เป็นคณะกรรมการลำดับสุดท้าย
2. จะเห็นผลงานทั้งหมดพร้อมคะแนน
3. อนุมัติ/ไม่อนุมัติ
4. Flow เสร็จสิ้น!

---

## Rules การประเมิน

### Rule 1: ส่งต่อปกติ
- ถ้าระดับผู้ประเมินถัดไป < 10 → ส่งต่อไปเรื่อยๆ

### Rule 2: หยุดที่ระดับ 10
- ถ้าประเมินแล้ว >= 2 ครั้ง และ ระดับถัดไป >= 10
- → ข้ามไปคณะกรรมการกลั่นกรองเลย

### Rule 3: บังคับประเมินที่ระดับ 10/11
- ถ้าประเมินแล้ว < 2 ครั้ง และ ระดับถัดไป >= 10
- → ต้องให้ระดับ 10/11 ประเมินก่อน

### Rule 4: กรณีพิเศษ
- ถ้าไม่มี PARENTORG หรือ MGRPERNR
- → ส่งเข้าคณะกรรมการกลั่นกรองทันที

---

## ข้อมูลที่ใช้

- **พนักงานทั้งหมด:** 8,915 คน
- **PARENTORG:** 166 กอง/เขต
- **ผลงานตัวอย่าง:** 10 ชิ้น

### ข้อมูลพนักงานจริงจากไฟล์ sa38-webmaster.xlsx

---

## API Endpoints

### Employees
- `GET /api/employees` - รายชื่อพนักงาน
- `GET /api/employees/:pernr` - ข้อมูลพนักงาน
- `GET /api/employees/:pernr/chain` - Chain of Command
- `GET /api/employees/login/options` - ตัวเลือกสำหรับ Login

### Work Results
- `GET /api/work-results` - รายการผลงาน
- `POST /api/work-results` - สร้างผลงานใหม่
- `GET /api/work-results/:id` - รายละเอียดผลงาน
- `GET /api/work-results/pending/:pernr` - ผลงานรอประเมิน
- `POST /api/work-results/:id/evaluate` - ประเมินผลงาน

### Others
- `GET /api/dashboard/stats` - สถิติระบบ
- `GET /api/dashboard/stats/:pernr` - สถิติผู้ใช้
- `POST /api/reset` - รีเซ็ตข้อมูล Demo

---

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Angular 17 + Tailwind CSS 3.0
- **Storage:** In-memory (JSON)

---

## หมายเหตุ

- นี่คือระบบ Demo สำหรับทดสอบ Flow
- ข้อมูลจะหายเมื่อ restart backend
- สามารถรีเซ็ตข้อมูลได้จากหน้า Dashboard
