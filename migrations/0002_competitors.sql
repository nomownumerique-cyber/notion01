CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
  public_url text NOT NULL CHECK (length(public_url) BETWEEN 1 AND 2048),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS competitors_tenant_created_idx ON competitors(tenant_id, created_at DESC);
CREATE TABLE IF NOT EXISTS competitor_observations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  competitor_id uuid NOT NULL,
  kind varchar(20) NOT NULL CHECK (kind IN ('publication', 'offer', 'price', 'positioning', 'other')),
  note text NOT NULL CHECK (length(trim(note)) BETWEEN 1 AND 5000),
  source_url text NOT NULL CHECK (length(source_url) BETWEEN 1 AND 2048),
  observed_date date NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, competitor_id) REFERENCES competitors(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS competitor_observations_lookup_idx ON competitor_observations(tenant_id, competitor_id, collected_at DESC);
