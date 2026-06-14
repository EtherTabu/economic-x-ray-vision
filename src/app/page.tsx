"use client";

import { useMemo, useState } from "react";
import { AnalysisWorkbench } from "@/components/AnalysisWorkbench";
import { ConstraintCard } from "@/components/ConstraintCard";
import { ConstraintFilters } from "@/components/ConstraintFilters";
import { constraintRegistry } from "@/data/constraintRegistry";
import {
  categoryOptions,
  type DecisionFilter,
  getConstraintsWithScores,
  opportunityTypeOptions,
  sortAndFilterConstraints
} from "@/lib/constraints";
import { analyzeOpportunities } from "@/lib/opportunityAnalysis";
import type {
  ConstraintCategory,
  OpportunityType,
  RecordOrigin,
  SortOption
} from "@/types/constraint";

export default function Home() {
  const [category, setCategory] = useState<ConstraintCategory | "All">("All");
  const [origin, setOrigin] = useState<RecordOrigin | "All">("All");
  const [opportunityType, setOpportunityType] = useState<OpportunityType | "All">(
    "All"
  );
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("total_priority_score");

  const scoredConstraints = useMemo(
    () => getConstraintsWithScores(constraintRegistry),
    []
  );

  const visibleConstraints = useMemo(
    () =>
      sortAndFilterConstraints(
        scoredConstraints,
        category,
        origin,
        opportunityType,
        decisionFilter,
        sortBy
      ),
    [category, decisionFilter, opportunityType, origin, scoredConstraints, sortBy]
  );

  const opportunityPortfolio = useMemo(
    () => analyzeOpportunities(scoredConstraints),
    [scoredConstraints]
  );

  const seedRecordCount = scoredConstraints.filter(
    (item) => item.origin === "seed"
  ).length;

  const intakeRecordCount = scoredConstraints.filter(
    (item) => item.origin === "intake"
  ).length;

  const averagePriority =
    scoredConstraints.reduce(
      (total, item) => total + item.scores.total_priority_score,
      0
    ) / scoredConstraints.length;

  const averageValidation =
    scoredConstraints.reduce(
      (total, item) => total + item.scores.validation_confidence_score,
      0
    ) / scoredConstraints.length;

  const topOpportunity = scoredConstraints.reduce((top, item) =>
    item.scores.overlooked_opportunity_score >
    top.scores.overlooked_opportunity_score
      ? item
      : top
  );

  const topPriority = scoredConstraints.reduce((top, item) =>
    item.scores.total_priority_score > top.scores.total_priority_score ? item : top
  );

  const highestStrategicOpportunity = scoredConstraints.reduce((top, item) =>
    item.scores.total_strategic_score > top.scores.total_strategic_score
      ? item
      : top
  );

  const mostConnectedConstraint = scoredConstraints.reduce((top, item) =>
    item.scores.constraint_density_score > top.scores.constraint_density_score
      ? item
      : top
  );

  const highestDownstreamImpact = scoredConstraints.reduce((top, item) =>
    item.scores.downstream_impact_score > top.scores.downstream_impact_score
      ? item
      : top
  );

  const highestAiSolvableOpportunity = scoredConstraints.reduce((top, item) =>
    item.scores.ai_readiness_score + item.scores.opportunity_score >
    top.scores.ai_readiness_score + top.scores.opportunity_score
      ? item
      : top
  );

  return (
    <main className="app-shell">
      <header className="page-header">
        <div className="page-header__inner">
          <p className="eyebrow">Constraint Intelligence Engine</p>
          <h1>Economic X-Ray Vision</h1>
          <p className="lede">
            A local-first constraint intelligence workbench for ranking
            healthcare administration friction, validating evidence, mapping
            graph position, and generating opportunity theses.
          </p>
          <div className="measurement-strip" aria-label="What this system measures">
            <span>Delay</span>
            <span>Duplicated work</span>
            <span>Hidden labor waste</span>
            <span>Manual verification</span>
            <span>Idle capacity</span>
          </div>
        </div>
      </header>

      <section className="page-main" aria-label="Constraint intelligence list">
        <section className="intelligence-overview" aria-label="Intelligence overview">
          <div className="overview-copy">
            <p className="section-kicker">V3.0 analyst workbench</p>
            <h2>Explain early friction before it turns into late-stage damage.</h2>
            <p>
              Economic X-Ray Vision combines deterministic scoring, validation
              confidence, graph position, and opportunity thesis analysis to
              show where value is being delayed, duplicated, trapped, or
              underused inside healthcare administration.
            </p>
          </div>

          <div className="priority-panel" aria-label="Highest priority constraint">
            <span>Highest priority constraint</span>
            <strong>{topPriority.title}</strong>
            <p>{topPriority.description}</p>
            <div className="priority-panel__meta">
              <span>{topPriority.category}</span>
              <span>Priority {topPriority.scores.total_priority_score.toFixed(1)}</span>
              <span>
                Validation{" "}
                {topPriority.scores.validation_confidence_score.toFixed(1)}
              </span>
            </div>
          </div>
        </section>

        <div className="summary-grid" aria-label="Portfolio summary metrics">
          <div className="summary-item">
            <span>Industry</span>
            <strong>Healthcare</strong>
          </div>
          <div className="summary-item">
            <span>Seed Records</span>
            <strong>{seedRecordCount}</strong>
          </div>
          <div className="summary-item">
            <span>Intake Records</span>
            <strong>{intakeRecordCount}</strong>
          </div>
          <div className="summary-item">
            <span>Total Visible</span>
            <strong>{visibleConstraints.length}</strong>
          </div>
          <div className="summary-item">
            <span>Average Priority</span>
            <strong>{averagePriority.toFixed(1)}</strong>
          </div>
          <div className="summary-item">
            <span>Average Validation</span>
            <strong>{averageValidation.toFixed(1)}</strong>
          </div>
          <div className="summary-item">
            <span>Top Overlooked Area</span>
            <strong>{topOpportunity.category}</strong>
          </div>
        </div>

        <section className="scoring-model" aria-label="Scoring model explanation">
          <div>
            <p className="section-kicker">Scoring model</p>
            <h2>Deterministic, inspectable ranking</h2>
          </div>
          <p>
            Scores are calculated locally from structured fields, not generated
            by an AI model. The workbench combines priority score, validation
            confidence, graph position, and strategic opportunity score with
            deterministic analyst explanations so each ranking can be inspected
            for defensibility and practical intervention paths.
          </p>
        </section>

        <section className="strategic-grid" aria-label="Strategic opportunity signals">
          <StrategicSignal
            label="Highest Strategic Opportunity"
            score={highestStrategicOpportunity.scores.total_strategic_score}
            title={highestStrategicOpportunity.title}
          />
          <StrategicSignal
            label="Most Connected Constraint"
            score={mostConnectedConstraint.scores.constraint_density_score}
            title={mostConnectedConstraint.title}
          />
          <StrategicSignal
            label="Highest Downstream Impact"
            score={highestDownstreamImpact.scores.downstream_impact_score}
            title={highestDownstreamImpact.title}
          />
          <StrategicSignal
            label="Highest AI-Solvable Opportunity"
            score={highestAiSolvableOpportunity.scores.ai_readiness_score}
            title={highestAiSolvableOpportunity.title}
          />
        </section>

        <AnalysisWorkbench portfolio={opportunityPortfolio} />

        <ConstraintFilters
          categories={categoryOptions(scoredConstraints)}
          category={category}
          decisionFilter={decisionFilter}
          opportunityTypes={opportunityTypeOptions(scoredConstraints)}
          opportunityType={opportunityType}
          origin={origin}
          resultCount={visibleConstraints.length}
          sortBy={sortBy}
          onCategoryChange={setCategory}
          onDecisionFilterChange={setDecisionFilter}
          onOpportunityTypeChange={setOpportunityType}
          onOriginChange={setOrigin}
          onSortChange={setSortBy}
        />

        <div className="constraint-list">
          {visibleConstraints.map((constraint) => (
            <ConstraintCard constraint={constraint} key={constraint.id} />
          ))}
        </div>

        {visibleConstraints.length === 0 ? (
          <div className="empty-state">No constraint objects match this filter.</div>
        ) : null}
      </section>
    </main>
  );
}

function StrategicSignal({
  label,
  score,
  title
}: {
  label: string;
  score: number;
  title: string;
}) {
  return (
    <div className="strategic-signal">
      <span>{label}</span>
      <strong>{title}</strong>
      <p>Score {score.toFixed(1)}</p>
    </div>
  );
}
