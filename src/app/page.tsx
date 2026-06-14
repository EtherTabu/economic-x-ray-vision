"use client";

import { useMemo, useState } from "react";
import { ConstraintCard } from "@/components/ConstraintCard";
import { ConstraintFilters } from "@/components/ConstraintFilters";
import { healthcareConstraints } from "@/data/healthcareConstraints";
import {
  categoryOptions,
  getConstraintsWithScores,
  sortAndFilterConstraints
} from "@/lib/constraints";
import type { ConstraintCategory, SortOption } from "@/types/constraint";

export default function Home() {
  const [category, setCategory] = useState<ConstraintCategory | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("total_priority_score");

  const scoredConstraints = useMemo(
    () => getConstraintsWithScores(healthcareConstraints),
    []
  );

  const visibleConstraints = useMemo(
    () => sortAndFilterConstraints(scoredConstraints, category, sortBy),
    [category, scoredConstraints, sortBy]
  );

  const averagePriority =
    scoredConstraints.reduce(
      (total, item) => total + item.scores.total_priority_score,
      0
    ) / scoredConstraints.length;

  const topOpportunity = scoredConstraints.reduce((top, item) =>
    item.scores.overlooked_opportunity_score >
    top.scores.overlooked_opportunity_score
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
            A local-first V1 for spotting healthcare administration friction
            before it becomes visible in traditional outcome metrics.
          </p>
        </div>
      </header>

      <section className="page-main" aria-label="Constraint intelligence list">
        <div className="summary-grid" aria-label="Portfolio summary metrics">
          <div className="summary-item">
            <span>Industry</span>
            <strong>Healthcare</strong>
          </div>
          <div className="summary-item">
            <span>Objects</span>
            <strong>{scoredConstraints.length}</strong>
          </div>
          <div className="summary-item">
            <span>Average Priority</span>
            <strong>{averagePriority.toFixed(1)}</strong>
          </div>
          <div className="summary-item">
            <span>Top Overlooked Area</span>
            <strong>{topOpportunity.category}</strong>
          </div>
        </div>

        <ConstraintFilters
          categories={categoryOptions(scoredConstraints)}
          category={category}
          resultCount={visibleConstraints.length}
          sortBy={sortBy}
          onCategoryChange={setCategory}
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
