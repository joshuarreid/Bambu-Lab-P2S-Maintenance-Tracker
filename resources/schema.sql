SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NULL,
  avatar_url VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oauth_accounts_provider_account (provider, provider_account_id),
  UNIQUE KEY uq_oauth_accounts_user_provider (user_id, provider),
  KEY idx_oauth_accounts_user_id (user_id),
  CONSTRAINT fk_oauth_accounts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (session_token_hash),
  KEY idx_sessions_user_id (user_id),
  KEY idx_sessions_expires_at (expires_at),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_maintenance_jobs_name (name),
  KEY idx_maintenance_jobs_active (active)
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  printer_hours DECIMAL(10, 2) NOT NULL,
  maintenance_job_id BIGINT UNSIGNED NOT NULL,
  category ENUM('ROUTINE', 'ERROR') NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_maintenance_records_printer_hours
    CHECK (printer_hours >= 0),
  CONSTRAINT fk_maintenance_records_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_maintenance_records_job
    FOREIGN KEY (maintenance_job_id) REFERENCES maintenance_jobs(id),
  KEY idx_maintenance_records_created_at (created_at),
  KEY idx_maintenance_records_printer_hours (printer_hours),
  KEY idx_maintenance_records_job_id (maintenance_job_id),
  KEY idx_maintenance_records_user_id (user_id)
);

INSERT INTO maintenance_jobs (name, description, active)
VALUES
  ('Clean build plate', 'Routine cleaning of the print surface to maintain adhesion.', 1),
  ('Remove filament debris', 'Clear loose filament scraps from the printer interior.', 1),
  ('Clean XY rods', 'Wipe down XY rods to remove dust and residue.', 1),
  ('Lubricate XY motion system', 'Apply lubrication to the XY motion components.', 1),
  ('Clean/grease Z lead screws', 'Clean and re-grease the Z lead screws.', 1),
  ('Inspect belts', 'Inspect belt tension and visible wear.', 1),
  ('Inspect idlers', 'Check idlers for wear, noise, or free movement issues.', 1),
  ('Clean extruder gears', 'Remove debris from the extruder gear assembly.', 1),
  ('Clean hotend/nozzle', 'Perform nozzle or hotend cleaning to improve extrusion.', 1),
  ('Inspect filament cutter', 'Inspect the cutter for wear or obstruction.', 1),
  ('Inspect PTFE tubes', 'Check PTFE tubes for wear, kinks, or heat damage.', 1),
  ('Clean fans', 'Remove dust buildup from cooling and chamber fans.', 1),
  ('Clean sensors/camera', 'Clean sensors and camera surfaces for reliable operation.', 1),
  ('Deep Z-axis maintenance', 'Perform more involved Z-axis inspection and servicing.', 1),
  ('Other', 'Catch-all job for maintenance not covered by the predefined list.', 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  active = VALUES(active);
