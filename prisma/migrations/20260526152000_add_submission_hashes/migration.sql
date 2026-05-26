ALTER TABLE fan_logs
ADD COLUMN ip_hash CHAR(64) NOT NULL,
ADD COLUMN user_agent_hash CHAR(64) NOT NULL;

CREATE INDEX fan_logs_locality_id_ip_hash_user_agent_hash_created_at_idx
ON fan_logs (locality_id, ip_hash, user_agent_hash, created_at DESC);