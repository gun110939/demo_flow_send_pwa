-- ============================================================================
-- Database Schema: ระบบประเมินผลงานตามลำดับสายบังคับบัญชา
-- Version: 1.0
-- Created: 23 November 2025
-- ============================================================================

-- ============================================================================
-- 1. Table: employees (พนักงาน)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
    PERNR INT PRIMARY KEY COMMENT 'รหัสพนักงาน',
    ENAME VARCHAR(255) NOT NULL COMMENT 'ชื่อ-นามสกุล',
    STELL VARCHAR(255) COMMENT 'ตำแหน่งงาน',
    PERSK INT COMMENT 'ระดับพนักงาน (1-12, 21, 31-32)',
    ORGEH VARCHAR(255) COMMENT 'หน่วยงาน',
    ORGEHID INT COMMENT 'รหัสหน่วยงาน',
    PARENTORG VARCHAR(255) COMMENT 'กอง/เขต - สำคัญสำหรับ Visibility',
    PARENTORGID INT COMMENT 'รหัสกอง/เขต',
    MGRPERNR INT COMMENT 'รหัสผู้บังคับบัญชาโดยตรง',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_mgrpernr (MGRPERNR),
    INDEX idx_parentorg (PARENTORG),
    INDEX idx_persk (PERSK),
    FOREIGN KEY (MGRPERNR) REFERENCES employees(PERNR) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. Table: work_results (ผลงานที่ส่งเข้ามา)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_pernr INT NOT NULL COMMENT 'รหัสพนักงานผู้ส่งผลงาน',
    title VARCHAR(500) NOT NULL COMMENT 'ชื่อผลงาน',
    description TEXT COMMENT 'รายละเอียดผลงาน',
    status ENUM('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'SENT_TO_COMMITTEE') 
        DEFAULT 'PENDING' COMMENT 'สถานะผลงาน',
    current_evaluator_pernr INT COMMENT 'ผู้ประเมินคนปัจจุบัน',
    evaluation_count INT DEFAULT 0 COMMENT 'จำนวนครั้งที่ถูกประเมินแล้ว',
    committee_stage ENUM('NONE', 'PRE_FINAL', 'FINAL') 
        DEFAULT 'NONE' COMMENT 'ขั้นตอนคณะกรรมการ',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่ส่งผลงาน',
    completed_at TIMESTAMP NULL COMMENT 'วันที่เสร็จสิ้น',
    
    FOREIGN KEY (employee_pernr) REFERENCES employees(PERNR) ON DELETE CASCADE,
    FOREIGN KEY (current_evaluator_pernr) REFERENCES employees(PERNR) ON DELETE SET NULL,
    
    INDEX idx_employee (employee_pernr),
    INDEX idx_status (status),
    INDEX idx_evaluator (current_evaluator_pernr),
    INDEX idx_committee (committee_stage),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Table: evaluation_history (ประวัติการประเมิน)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evaluation_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_result_id INT NOT NULL COMMENT 'รหัสผลงาน',
    evaluator_pernr INT NOT NULL COMMENT 'รหัสผู้ประเมิน',
    evaluator_level INT COMMENT 'PERSK ของผู้ประเมิน',
    evaluation_order INT NOT NULL COMMENT 'ลำดับที่ในการประเมิน (1, 2, 3, ...)',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT 'สถานะการประเมิน',
    comments TEXT COMMENT 'ความคิดเห็นจากผู้ประเมิน',
    evaluated_at TIMESTAMP NULL COMMENT 'วันที่ประเมิน',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (work_result_id) REFERENCES work_results(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_pernr) REFERENCES employees(PERNR) ON DELETE CASCADE,
    
    INDEX idx_work_result (work_result_id),
    INDEX idx_evaluator (evaluator_pernr),
    INDEX idx_status (status),
    INDEX idx_evaluated (evaluated_at),
    
    UNIQUE KEY unique_evaluation (work_result_id, evaluator_pernr, evaluation_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. Table: committee_members (สมาชิกคณะกรรมการ)
-- ============================================================================
CREATE TABLE IF NOT EXISTS committee_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_pernr INT NOT NULL COMMENT 'รหัสพนักงานที่เป็นคณะกรรมการ',
    committee_stage ENUM('PRE_FINAL', 'FINAL') NOT NULL COMMENT 'ประเภทคณะกรรมการ',
    parentorg_filter VARCHAR(255) COMMENT 'PARENTORG ที่มองเห็น (NULL = เห็นทั้งหมด)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'สถานะใช้งาน',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่แต่งตั้ง',
    removed_at TIMESTAMP NULL COMMENT 'วันที่ถอดถอน',
    
    FOREIGN KEY (employee_pernr) REFERENCES employees(PERNR) ON DELETE CASCADE,
    
    INDEX idx_employee (employee_pernr),
    INDEX idx_stage (committee_stage),
    INDEX idx_parentorg (parentorg_filter),
    INDEX idx_active (is_active),
    
    UNIQUE KEY unique_member (employee_pernr, committee_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. Table: attachments (ไฟล์แนบ)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_result_id INT NOT NULL COMMENT 'รหัสผลงาน',
    file_name VARCHAR(500) NOT NULL COMMENT 'ชื่อไฟล์',
    file_path VARCHAR(1000) NOT NULL COMMENT 'ที่อยู่ไฟล์',
    file_size BIGINT COMMENT 'ขนาดไฟล์ (bytes)',
    file_type VARCHAR(100) COMMENT 'ประเภทไฟล์ (MIME type)',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (work_result_id) REFERENCES work_results(id) ON DELETE CASCADE,
    
    INDEX idx_work_result (work_result_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. Table: notifications (การแจ้งเตือน)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_pernr INT NOT NULL COMMENT 'รหัสพนักงานที่ได้รับแจ้งเตือน',
    work_result_id INT COMMENT 'รหัสผลงาน (ถ้ามี)',
    type ENUM('NEW_EVALUATION', 'EVALUATION_RESULT', 'SENT_TO_COMMITTEE', 'SYSTEM') 
        DEFAULT 'SYSTEM' COMMENT 'ประเภทการแจ้งเตือน',
    title VARCHAR(500) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_pernr) REFERENCES employees(PERNR) ON DELETE CASCADE,
    FOREIGN KEY (work_result_id) REFERENCES work_results(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_pernr),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. Table: system_logs (ระบบบันทึก)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    work_result_id INT COMMENT 'รหัสผลงาน',
    employee_pernr INT COMMENT 'รหัสพนักงานที่ทำการ',
    action VARCHAR(100) NOT NULL COMMENT 'การกระทำ',
    description TEXT COMMENT 'รายละเอียด',
    ip_address VARCHAR(45) COMMENT 'IP Address',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (work_result_id) REFERENCES work_results(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_pernr) REFERENCES employees(PERNR) ON DELETE SET NULL,
    
    INDEX idx_work_result (work_result_id),
    INDEX idx_employee (employee_pernr),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Views: สร้าง Views สำหรับการ Query ที่ใช้บ่อย
-- ============================================================================

-- View: รายการผลงานพร้อมข้อมูลพนักงาน
CREATE OR REPLACE VIEW v_work_results_with_employee AS
SELECT 
    wr.*,
    e.ENAME as employee_name,
    e.STELL as employee_position,
    e.PERSK as employee_level,
    e.PARENTORG as employee_parentorg,
    ev.ENAME as evaluator_name,
    ev.STELL as evaluator_position,
    ev.PERSK as evaluator_level
FROM work_results wr
INNER JOIN employees e ON wr.employee_pernr = e.PERNR
LEFT JOIN employees ev ON wr.current_evaluator_pernr = ev.PERNR;

-- View: สถิติการประเมินตาม PARENTORG
CREATE OR REPLACE VIEW v_evaluation_stats_by_parentorg AS
SELECT 
    e.PARENTORG,
    COUNT(DISTINCT wr.id) as total_works,
    SUM(CASE WHEN wr.status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN wr.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_count,
    SUM(CASE WHEN wr.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
    SUM(CASE WHEN wr.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
    SUM(CASE WHEN wr.status = 'SENT_TO_COMMITTEE' THEN 1 ELSE 0 END) as committee_count
FROM work_results wr
INNER JOIN employees e ON wr.employee_pernr = e.PERNR
GROUP BY e.PARENTORG;

-- ============================================================================
-- Stored Procedures: Functions สำหรับ Core Logic
-- ============================================================================

DELIMITER //

-- Function: ดึง Chain of Command
CREATE PROCEDURE sp_get_chain_of_command(IN p_pernr INT)
BEGIN
    WITH RECURSIVE chain AS (
        -- Base case
        SELECT 
            PERNR,
            ENAME,
            STELL,
            PERSK,
            PARENTORG,
            MGRPERNR,
            1 as level
        FROM employees
        WHERE PERNR = p_pernr
        
        UNION ALL
        
        -- Recursive case
        SELECT 
            e.PERNR,
            e.ENAME,
            e.STELL,
            e.PERSK,
            e.PARENTORG,
            e.MGRPERNR,
            c.level + 1
        FROM employees e
        INNER JOIN chain c ON e.PERNR = c.MGRPERNR
        WHERE c.level < 10  -- ป้องกันการวนลูปไม่รู้จบ
    )
    SELECT * FROM chain ORDER BY level;
END//

-- Function: ตรวจสอบ Visibility
CREATE FUNCTION fn_check_visibility(
    p_evaluator_pernr INT,
    p_employee_pernr INT
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_evaluator_parentorg VARCHAR(255);
    DECLARE v_employee_parentorg VARCHAR(255);
    DECLARE v_is_final_committee BOOLEAN;
    
    -- ดึง PARENTORG ของผู้ประเมิน
    SELECT PARENTORG INTO v_evaluator_parentorg
    FROM employees WHERE PERNR = p_evaluator_pernr;
    
    -- ดึง PARENTORG ของพนักงาน
    SELECT PARENTORG INTO v_employee_parentorg
    FROM employees WHERE PERNR = p_employee_pernr;
    
    -- ตรวจสอบว่าเป็นคณะกรรมการลำดับสุดท้ายหรือไม่
    SELECT COUNT(*) > 0 INTO v_is_final_committee
    FROM committee_members
    WHERE employee_pernr = p_evaluator_pernr
        AND committee_stage = 'FINAL'
        AND is_active = TRUE;
    
    -- ถ้าเป็นคณะกรรมการลำดับสุดท้าย → เห็นทั้งหมด
    IF v_is_final_committee THEN
        RETURN TRUE;
    END IF;
    
    -- ถ้าไม่ใช่ → ต้อง PARENTORG ตรงกัน
    IF v_evaluator_parentorg = v_employee_parentorg THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END//

DELIMITER ;

-- ============================================================================
-- Sample Data: ตัวอย่างข้อมูลสำหรับ Testing
-- ============================================================================

-- Insert คณะกรรมการตัวอย่าง (ต้องแก้ PERNR ตามข้อมูลจริง)
-- INSERT INTO committee_members (employee_pernr, committee_stage, parentorg_filter, is_active) VALUES
-- (500060, 'PRE_FINAL', 'การประปาส่วนภูมิภาค', TRUE),
-- (500060, 'FINAL', NULL, TRUE);

-- ============================================================================
-- Indexes สำหรับ Performance Optimization
-- ============================================================================

-- Composite Index สำหรับ Query ที่ใช้บ่อย
CREATE INDEX idx_work_status_evaluator ON work_results(status, current_evaluator_pernr);
CREATE INDEX idx_employee_parentorg_persk ON employees(PARENTORG, PERSK);

-- Full-text Search สำหรับค้นหาผลงาน (ถ้าต้องการ)
-- ALTER TABLE work_results ADD FULLTEXT INDEX ft_title_description (title, description);

-- ============================================================================
-- Comments
-- ============================================================================

-- สรุปข้อมูลสำคัญ:
-- - พนักงานทั้งหมด: 8,915 คน
-- - PARENTORG: 166 กอง/เขต
-- - ระดับพนักงาน (PERSK): 1-12, 21, 31-32
-- - Chain of Command เฉลี่ย: 5.72 ขั้น
-- - พนักงาน 98.23% มีระดับ 10/11 ใน Chain

-- ============================================================================
-- End of Schema
-- ============================================================================
