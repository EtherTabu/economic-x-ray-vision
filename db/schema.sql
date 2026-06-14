-- Planned SQLite schema for a future local data layer.
-- V1 currently renders static TypeScript seed data from src/data.

CREATE TABLE IF NOT EXISTS constraints (
  id TEXT PRIMARY KEY,
  industry TEXT NOT NULL,
  subsector TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  affected_parties_json TEXT NOT NULL,
  current_process_json TEXT NOT NULL,
  resource_waste_json TEXT NOT NULL,
  time_waste INTEGER NOT NULL CHECK (time_waste BETWEEN 1 AND 10),
  capital_waste INTEGER NOT NULL CHECK (capital_waste BETWEEN 1 AND 10),
  labor_waste INTEGER NOT NULL CHECK (labor_waste BETWEEN 1 AND 10),
  opportunity_cost TEXT NOT NULL,
  estimated_annual_impact TEXT NOT NULL,
  growth_trend TEXT NOT NULL CHECK (growth_trend IN ('Decreasing', 'Stable', 'Increasing')),
  visibility_score INTEGER NOT NULL CHECK (visibility_score BETWEEN 1 AND 10),
  overlooked_score INTEGER NOT NULL CHECK (overlooked_score BETWEEN 1 AND 10),
  digital_solution_potential INTEGER NOT NULL CHECK (digital_solution_potential BETWEEN 1 AND 10),
  automation_potential INTEGER NOT NULL CHECK (automation_potential BETWEEN 1 AND 10),
  ai_potential INTEGER NOT NULL CHECK (ai_potential BETWEEN 1 AND 10),
  implementation_complexity INTEGER NOT NULL CHECK (implementation_complexity BETWEEN 1 AND 10),
  regulatory_complexity INTEGER NOT NULL CHECK (regulatory_complexity BETWEEN 1 AND 10),
  adoption_complexity INTEGER NOT NULL CHECK (adoption_complexity BETWEEN 1 AND 10),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 10),
  sources_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS constraint_scores (
  constraint_id TEXT PRIMARY KEY,
  severity_score REAL NOT NULL,
  solvability_score REAL NOT NULL,
  ai_readiness_score REAL NOT NULL,
  overlooked_opportunity_score REAL NOT NULL,
  total_priority_score REAL NOT NULL,
  scored_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (constraint_id) REFERENCES constraints(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_constraints_category ON constraints(category);
CREATE INDEX IF NOT EXISTS idx_constraints_subsector ON constraints(subsector);
CREATE INDEX IF NOT EXISTS idx_constraint_scores_priority
  ON constraint_scores(total_priority_score DESC);
