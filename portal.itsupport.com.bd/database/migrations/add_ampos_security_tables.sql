-- =====================================================
-- AMPOS Security Enhancement Database Migration
-- =====================================================
-- This migration adds security features for AMPOS:
-- 1. Security incidents tracking table
-- 2. Checksum and suspension fields to licenses table
-- 3. Device tracking enhancements
-- 
-- Execute this file to add security features to your database
-- =====================================================

-- Create security incidents table for tracking tampering and violations
CREATE TABLE IF NOT EXISTS `ampos_security_incidents` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `license_id` INT UNSIGNED NOT NULL,
  `event_type` VARCHAR(50) NOT NULL COMMENT 'Type: tampering_detected, unauthorized_access, etc.',
  `reason` VARCHAR(255) NOT NULL COMMENT 'Detailed reason for the incident',
  `device_id` VARCHAR(100) DEFAULT NULL COMMENT 'Unique device identifier',
  `hostname` VARCHAR(255) DEFAULT NULL COMMENT 'System hostname',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP address (IPv4 or IPv6)',
  `incident_data` JSON DEFAULT NULL COMMENT 'Additional incident details in JSON format',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_license_id` (`license_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`license_id`) REFERENCES `licenses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AMPOS security incidents and tampering detection log';

-- Add checksum and suspension tracking columns to licenses table
ALTER TABLE `licenses` 
ADD COLUMN IF NOT EXISTS `code_checksum` VARCHAR(64) DEFAULT NULL COMMENT 'SHA-256 checksum of AMPOS code for integrity verification',
ADD COLUMN IF NOT EXISTS `suspension_reason` TEXT DEFAULT NULL COMMENT 'Reason for license suspension if applicable',
ADD COLUMN IF NOT EXISTS `last_check_in` TIMESTAMP NULL DEFAULT NULL COMMENT 'Last time license checked in with portal',
ADD COLUMN IF NOT EXISTS `hardware_fingerprint` VARCHAR(64) DEFAULT NULL COMMENT 'Unique hardware identifier for binding',
ADD INDEX IF NOT EXISTS `idx_code_checksum` (`code_checksum`),
ADD INDEX IF NOT EXISTS `idx_last_check_in` (`last_check_in`);

-- Create license devices table if it doesn't exist (for device tracking)
CREATE TABLE IF NOT EXISTS `license_devices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `license_id` INT UNSIGNED NOT NULL,
  `device_id` VARCHAR(100) NOT NULL COMMENT 'Unique device identifier (hash of MAC+hostname)',
  `hostname` VARCHAR(255) DEFAULT NULL COMMENT 'Device hostname',
  `mac_address` VARCHAR(255) DEFAULT NULL COMMENT 'MAC addresses (comma-separated)',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Last known IP address',
  `first_seen` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'First registration time',
  `last_seen` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last activity time',
  `status` ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  `metadata` JSON DEFAULT NULL COMMENT 'Additional device information',
  UNIQUE KEY `unique_license_device` (`license_id`, `device_id`),
  INDEX `idx_license_id` (`license_id`),
  INDEX `idx_device_id` (`device_id`),
  INDEX `idx_last_seen` (`last_seen`),
  FOREIGN KEY (`license_id`) REFERENCES `licenses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks devices registered to each AMPOS license';

-- Create license verification logs table for audit trail
CREATE TABLE IF NOT EXISTS `license_verification_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `license_id` INT UNSIGNED NOT NULL,
  `device_id` VARCHAR(100) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `checksum` VARCHAR(64) DEFAULT NULL COMMENT 'Code checksum at verification time',
  `version` VARCHAR(20) DEFAULT NULL COMMENT 'AMPOS version',
  `status` ENUM('success', 'failed', 'expired', 'suspended', 'tampered') DEFAULT 'success',
  `error_message` TEXT DEFAULT NULL,
  `verified_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_license_id` (`license_id`),
  INDEX `idx_verified_at` (`verified_at`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`license_id`) REFERENCES `licenses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log of all license verification attempts';

-- Update existing licenses to set initial last_check_in if NULL
UPDATE `licenses` 
SET `last_check_in` = COALESCE(`last_check_in`, `created_at`, NOW())
WHERE `last_check_in` IS NULL;

-- Insert initial comment in security incidents table (optional)
INSERT INTO `ampos_security_incidents` (`license_id`, `event_type`, `reason`, `device_id`, `hostname`, `ip_address`, `incident_data`) 
VALUES (1, 'system_initialized', 'AMPOS security system initialized', 'system', 'portal-server', '127.0.0.1', '{"version": "2.0.0", "status": "operational"}')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Create view for active licenses with security status
CREATE OR REPLACE VIEW `ampos_license_security_status` AS
SELECT 
    l.id,
    l.license_key,
    l.status,
    l.expires_at,
    l.last_check_in,
    l.code_checksum,
    l.suspension_reason,
    l.hardware_fingerprint,
    DATEDIFF(NOW(), l.last_check_in) AS days_since_checkin,
    CASE 
        WHEN DATEDIFF(NOW(), l.last_check_in) > 7 THEN 'connection_timeout'
        WHEN l.expires_at < NOW() THEN 'expired'
        WHEN l.status = 'suspended' THEN 'suspended'
        WHEN l.status = 'active' THEN 'active'
        ELSE l.status
    END AS security_status,
    (SELECT COUNT(*) FROM ampos_security_incidents WHERE license_id = l.id) AS incident_count,
    (SELECT COUNT(*) FROM license_devices WHERE license_id = l.id AND status = 'active') AS active_devices,
    c.first_name,
    c.last_name,
    c.email,
    p.name AS product_name
FROM licenses l
JOIN customers c ON l.customer_id = c.id
JOIN products p ON l.product_id = p.id
WHERE p.category = 'AMPOS';

-- =====================================================
-- Migration Complete
-- =====================================================
-- Tables created:
-- 1. ampos_security_incidents - Security event tracking
-- 2. license_devices - Device registration tracking
-- 3. license_verification_logs - Verification audit trail
--
-- Columns added to licenses table:
-- 1. code_checksum - Code integrity verification
-- 2. suspension_reason - Suspension details
-- 3. last_check_in - Connection tracking
-- 4. hardware_fingerprint - Hardware binding
--
-- Views created:
-- 1. ampos_license_security_status - Security overview
-- =====================================================
