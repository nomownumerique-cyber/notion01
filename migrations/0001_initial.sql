CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY, email varchar(254) NOT NULL UNIQUE, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS tenants (id uuid PRIMARY KEY, name varchar(120) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS memberships (tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role varchar(20) NOT NULL CHECK (role IN ('owner','editor','reviewer')), PRIMARY KEY (tenant_id,user_id));
CREATE TABLE IF NOT EXISTS sessions (token_hash varchar(64) PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL, FOREIGN KEY (tenant_id,user_id) REFERENCES memberships(tenant_id,user_id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS posts (id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, text text NOT NULL CHECK (length(text) BETWEEN 1 AND 10000), status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS posts_tenant_created_idx ON posts(tenant_id,created_at DESC);
CREATE TABLE IF NOT EXISTS auth_attempts (key varchar(64) PRIMARY KEY, attempts integer NOT NULL, window_start timestamptz NOT NULL);
