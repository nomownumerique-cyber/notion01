ALTER TABLE posts ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0 CHECK (version >= 0);
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('idea', 'draft', 'review', 'approved'));
CREATE UNIQUE INDEX IF NOT EXISTS posts_tenant_id_unique ON posts(tenant_id, id);
CREATE TABLE IF NOT EXISTS editorial_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  post_id uuid NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES users(id),
  from_status varchar(20) NOT NULL,
  to_status varchar(20) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, post_id) REFERENCES posts(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS editorial_events_tenant_created_idx ON editorial_events(tenant_id, created_at DESC);
