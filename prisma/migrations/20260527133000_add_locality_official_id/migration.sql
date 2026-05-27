ALTER TABLE localities
ADD COLUMN official_id VARCHAR(60);

UPDATE localities
SET official_id = id::text
WHERE official_id IS NULL;

ALTER TABLE localities
ALTER COLUMN official_id SET NOT NULL;

CREATE UNIQUE INDEX localities_official_id_key ON localities (official_id);