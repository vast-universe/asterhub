-- Aster V2 数据库 Schema
-- 运行: psql $POSTGRES_URL -f scripts/migrate.sql

-- =====================================================
-- 用户表
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_id VARCHAR(50) UNIQUE NOT NULL,
  github_username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  avatar_url VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 命名空间表
-- =====================================================
CREATE TABLE IF NOT EXISTS namespaces (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Token 表
-- =====================================================
CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(50),
  scopes TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- =====================================================
-- 资源表
-- =====================================================
CREATE TABLE IF NOT EXISTS registry_items (
  id SERIAL PRIMARY KEY,
  namespace_id INT REFERENCES namespaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  style VARCHAR(50),
  description TEXT,
  keywords TEXT[],
  latest_version VARCHAR(20),
  total_downloads INT DEFAULT 0,
  is_official BOOLEAN DEFAULT false,
  deprecated BOOLEAN DEFAULT false,
  deprecated_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(namespace_id, name, type, style)
);

-- =====================================================
-- 版本表
-- =====================================================
CREATE TABLE IF NOT EXISTS registry_versions (
  id SERIAL PRIMARY KEY,
  item_id INT REFERENCES registry_items(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  r2_path VARCHAR(500) NOT NULL,
  file_size INT,
  integrity VARCHAR(100),
  downloads INT DEFAULT 0,
  deprecated BOOLEAN DEFAULT false,
  deprecated_message TEXT,
  published_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(item_id, version)
);

-- =====================================================
-- 下载统计表
-- =====================================================
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  item_id INT REFERENCES registry_items(id) ON DELETE CASCADE,
  version VARCHAR(20),
  date DATE DEFAULT CURRENT_DATE,
  count INT DEFAULT 1,
  
  UNIQUE(item_id, version, date)
);

-- =====================================================
-- 安全公告表
-- =====================================================
CREATE TABLE IF NOT EXISTS security_advisories (
  id SERIAL PRIMARY KEY,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  affected_items INT[],
  affected_versions TEXT[],
  patched_version VARCHAR(20),
  cve_id VARCHAR(50),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 发布日志表
-- =====================================================
CREATE TABLE IF NOT EXISTS publish_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  namespace_id INT REFERENCES namespaces(id) ON DELETE CASCADE,
  item_count INT,
  total_size INT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_namespaces_user_id ON namespaces(user_id);
CREATE INDEX IF NOT EXISTS idx_namespaces_name ON namespaces(name);

CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_registry_items_namespace ON registry_items(namespace_id);
CREATE INDEX IF NOT EXISTS idx_registry_items_type ON registry_items(type);
CREATE INDEX IF NOT EXISTS idx_registry_items_name ON registry_items(name);
CREATE INDEX IF NOT EXISTS idx_registry_items_downloads ON registry_items(total_downloads DESC);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_registry_items_search ON registry_items 
USING GIN (to_tsvector('simple', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(keywords, ' '), '')));

CREATE INDEX IF NOT EXISTS idx_registry_versions_item ON registry_versions(item_id);
CREATE INDEX IF NOT EXISTS idx_registry_versions_version ON registry_versions(item_id, version);

CREATE INDEX IF NOT EXISTS idx_downloads_item ON downloads(item_id);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON downloads(date);

CREATE INDEX IF NOT EXISTS idx_publish_logs_user ON publish_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_time ON publish_logs(created_at);
