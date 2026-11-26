ALTER TABLE posts ADD COLUMN IF NOT EXISTS planned_date date;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category varchar(80);
CREATE INDEX IF NOT EXISTS posts_tenant_planned_date_idx ON posts(tenant_id, planned_date) WHERE planned_date IS NOT NULL;
