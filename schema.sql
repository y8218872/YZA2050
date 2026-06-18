-- -------------------------------------------------------------
-- نظام المسّير لإدارة الذمم والعمليات المالية
-- هيكلية قاعدة بيانات MySQL (schema.sql)
-- متوافقة بالكامل مع نظام القيد المزدوج والاستعلامات المحمية PDO
-- -------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `al_mussair_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `al_mussair_db`;

-- 1. جدول المستخدمين (users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `pin` CHAR(4) NOT NULL, -- رمز الدخول المكون من 4 أرقام
  `role` ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول العملاء (clients)
CREATE TABLE IF NOT EXISTS `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول العمليات والقيود المالية (transactions)
-- يعتمد نظام القيد المزدوج البسيط (دين debt / سداد payment)
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT NOT NULL,
  `type` ENUM('debt', 'payment') NOT NULL, -- دين (debt) أو سداد (payment)
  `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `date` DATE NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_transactions_client` FOREIGN KEY (`client_id`) 
    REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول سجل الرقابة والأمن (audit_logs)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `username` VARCHAR(100) NOT NULL, -- لتسهيل القراءة حتى لو حذف المستخدم
  `action_type` VARCHAR(50) NOT NULL, -- نوع العملية المجرية (مثال: دخول، قيد دين، حذف عميل)
  `details` TEXT NOT NULL, -- تفاصيل العملية بالكامل
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول مصفوفة صلاحيات الموظفين (permissions)
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `allow_add` TINYINT(1) NOT NULL DEFAULT 1,     -- السماح بالإضافة
  `allow_edit` TINYINT(1) NOT NULL DEFAULT 0,    -- السماح بالتعديل
  `allow_delete` TINYINT(1) NOT NULL DEFAULT 0,  -- السماح بالحذف
  `allow_stats` TINYINT(1) NOT NULL DEFAULT 1,   -- السماح باستعراض الإحصائيات الختامية
  CONSTRAINT `fk_permissions_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- إضافة بيانات أولية للتجربة والتهيئة (Seed Data)
-- -------------------------------------------------------------

-- إضافة المدير (PIN: 1234) والموظف الافتراضي (PIN: 4321)
INSERT INTO `users` (`id`, `username`, `pin`, `role`) VALUES
(1, 'المدير العام', '1234', 'admin'),
(2, 'الموظف المالي', '4321', 'staff')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- تعيين صلاحيات الموظف المالي الافتراضية
INSERT INTO `permissions` (`user_id`, `allow_add`, `allow_edit`, `allow_delete`, `allow_stats`) VALUES
(2, 1, 0, 0, 1)
ON DUPLICATE KEY UPDATE `user_id`=`user_id`;

-- إضافة بعض العملاء للتجريب والتهيئة
INSERT INTO `clients` (`id`, `name`, `phone`, `email`, `notes`) VALUES
(1, 'مؤسسة الوفاء للتجارة', '0501234567', 'contact@alwafaa.com', 'عميل جملة لتوريد المواد الأساسية'),
(2, 'شركة النور للخدمات العامة', '0557654321', 'info@alnoor.com', 'عقد سداد شهري'),
(3, 'سعود عبد الله العتيبي', '0533322111', 'saud@example.com', 'عميل تجزئة مباشر')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- إضافة عينات من القيود المالية لدعم الإحصائيات الفورية
INSERT INTO `transactions` (`client_id`, `type`, `amount`, `date`, `description`) VALUES
(1, 'debt', 15000.00, '2026-06-01', 'شراء مواد بناء آجلة - فاتورة رقم 887'),
(1, 'payment', 5000.00, '2026-06-05', 'سداد نقدي في الحساب - سند رقم 202'),
(2, 'debt', 4200.00, '2026-06-10', 'تقديم خدمات صيانة دورية'),
(3, 'debt', 950.00, '2026-06-12', 'مبيعات متنوعة')
ON DUPLICATE KEY UPDATE `amount`=`amount`;

-- تسجيل أول عملية رقابية آمنة
INSERT INTO `audit_logs` (`user_id`, `username`, `action_type`, `details`, `ip_address`) VALUES
(1, 'المدير العام', 'إعداد النظام', 'تهيئة قاعدة البيانات وإضافة البيانات التجريبية الأولية', '127.0.0.1');
