# AMPOS Database Migrations

This directory contains database migration files and utilities for the AMPOS security system.

## 📁 Files

- **`migrations/add_ampos_security_tables.sql`** - SQL migration file with security tables
- **`run_migration.php`** - Automated migration runner (web & CLI)
- **`README.md`** - This documentation file

## 🚀 Quick Start - Run Migration

You have **3 options** to execute the database migration:

### Option 1: Web Browser (Recommended)

1. Open your browser and navigate to:
   ```
   https://portal.itsupport.com.bd/database/run_migration.php
   ```

2. Enter the migration password: `ampos_secure_2025`

3. Click "Authenticate" and wait for the migration to complete

4. **Important:** Delete `run_migration.php` after successful migration for security

### Option 2: Command Line (SSH)

1. SSH into your server:
   ```bash
   ssh user@portal.itsupport.com.bd
   ```

2. Navigate to the database directory:
   ```bash
   cd /path/to/portal.itsupport.com.bd/database
   ```

3. Run the migration script:
   ```bash
   php run_migration.php
   ```

4. Delete the migration runner:
   ```bash
   rm run_migration.php
   ```

### Option 3: Direct MySQL Import

1. Access your MySQL database:
   ```bash
   mysql -u your_username -p your_database_name
   ```

2. Source the migration file:
   ```sql
   source /path/to/portal.itsupport.com.bd/database/migrations/add_ampos_security_tables.sql;
   ```

3. Or import via command line:
   ```bash
   mysql -u your_username -p your_database_name < migrations/add_ampos_security_tables.sql
   ```

## 📊 What Gets Created

### New Tables

#### 1. `ampos_security_incidents`
Tracks all security-related events and tampering attempts.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Unique incident ID |
| license_id | INT | Associated license |
| event_type | VARCHAR(50) | Event type (tampering_detected, etc.) |
| reason | VARCHAR(255) | Detailed reason |
| device_id | VARCHAR(100) | Device identifier |
| hostname | VARCHAR(255) | System hostname |
| ip_address | VARCHAR(45) | IP address (IPv4/IPv6) |
| incident_data | JSON | Additional incident details |
| created_at | TIMESTAMP | When incident occurred |

#### 2. `license_devices`
Tracks all devices registered to each AMPOS license.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Unique device registration ID |
| license_id | INT | Associated license |
| device_id | VARCHAR(100) | Unique device hash |
| hostname | VARCHAR(255) | Device hostname |
| mac_address | VARCHAR(255) | MAC addresses (comma-separated) |
| ip_address | VARCHAR(45) | Last known IP |
| first_seen | TIMESTAMP | First registration time |
| last_seen | TIMESTAMP | Last activity time |
| status | ENUM | active, inactive, or blocked |
| metadata | JSON | Additional device info |

#### 3. `license_verification_logs`
Audit trail of all license verification attempts.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Unique log ID |
| license_id | INT | Associated license |
| device_id | VARCHAR(100) | Device identifier |
| ip_address | VARCHAR(45) | Request IP address |
| checksum | VARCHAR(64) | Code checksum at verification |
| version | VARCHAR(20) | AMPOS version |
| status | ENUM | success, failed, expired, suspended, tampered |
| error_message | TEXT | Error details if failed |
| verified_at | TIMESTAMP | Verification timestamp |

### Modified Tables

#### `licenses` table - New columns added:

| Column | Type | Description |
|--------|------|-------------|
| code_checksum | VARCHAR(64) | SHA-256 checksum for code integrity |
| suspension_reason | TEXT | Reason if license is suspended |
| last_check_in | TIMESTAMP | Last portal connection time |
| hardware_fingerprint | VARCHAR(64) | Unique hardware identifier |

### New Views

#### `ampos_license_security_status`
Comprehensive security overview of all AMPOS licenses.

Provides:
- License basic information
- Days since last check-in
- Current security status (active, expired, connection_timeout, suspended)
- Incident count
- Active device count
- Customer details

## 🔍 Verification

After running the migration, verify everything was created:

```sql
-- Check if tables exist
SHOW TABLES LIKE 'ampos_%';
SHOW TABLES LIKE 'license_%';

-- Check new columns in licenses table
DESCRIBE licenses;

-- Check the security status view
SELECT * FROM ampos_license_security_status;

-- Verify indexes
SHOW INDEXES FROM ampos_security_incidents;
SHOW INDEXES FROM license_devices;
SHOW INDEXES FROM license_verification_logs;
```

## ⚠️ Important Notes

### Security

1. **Delete migration runner** after successful migration:
   ```bash
   rm run_migration.php
   ```

2. **Change the migration password** in `run_migration.php` before first use:
   ```php
   $MIGRATION_PASSWORD = 'your_secure_password_here';
   ```

3. **Backup your database** before running migrations:
   ```bash
   mysqldump -u username -p database_name > backup_before_migration.sql
   ```

### Compatibility

- **MySQL Version:** 5.7+ or MariaDB 10.2+
- **Required:** JSON column support
- **Required:** Foreign key constraint support (InnoDB engine)

### Rollback

If you need to rollback the migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS license_verification_logs;
DROP TABLE IF EXISTS license_devices;
DROP TABLE IF EXISTS ampos_security_incidents;

-- Drop view
DROP VIEW IF EXISTS ampos_license_security_status;

-- Remove added columns from licenses table
ALTER TABLE licenses 
DROP COLUMN IF EXISTS code_checksum,
DROP COLUMN IF EXISTS suspension_reason,
DROP COLUMN IF EXISTS last_check_in,
DROP COLUMN IF EXISTS hardware_fingerprint;
```

## 📝 Migration Log

The migration runner automatically:
- ✅ Creates all tables with proper indexes
- ✅ Adds columns to existing tables
- ✅ Creates database views
- ✅ Handles existing tables/columns gracefully
- ✅ Uses transactions for safety (rollback on error)
- ✅ Provides detailed execution log
- ✅ Verifies all changes after completion

## 🐛 Troubleshooting

### Error: "Table already exists"
**Solution:** This is normal. The migration will skip existing tables.

### Error: "Duplicate column name"
**Solution:** This is normal. The migration will skip existing columns.

### Error: "Access denied"
**Solution:** Ensure your database user has these privileges:
```sql
GRANT CREATE, ALTER, INDEX, REFERENCES ON database_name.* TO 'username'@'localhost';
```

### Error: "Unknown column in foreign key"
**Solution:** Ensure the `licenses` table exists and has an `id` column before running migration.

### Migration incomplete or failed
**Solution:** 
1. Check the error message displayed
2. Review your database credentials in `config.php`
3. Ensure MySQL/MariaDB version is 5.7+
4. Check database user permissions
5. Try the direct MySQL import method (Option 3)

## 📞 Support

If you encounter issues:

- **Email:** support@itsupport.com.bd
- **Portal:** https://portal.itsupport.com.bd/support.php
- **Documentation:** Check migration logs for detailed error messages

## 📋 Version History

### v2.0.0 - December 2025
- Added AMPOS security incident tracking
- Added device registration tracking
- Added verification audit logs
- Enhanced license table with security fields
- Created security status view for monitoring

---

**⚠️ Remember:** Always backup your database before running any migration!
