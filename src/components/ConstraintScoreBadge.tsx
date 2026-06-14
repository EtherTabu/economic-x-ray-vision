type ConstraintScoreBadgeProps = {
  label: string;
  score: number;
};

export function ConstraintScoreBadge({ label, score }: ConstraintScoreBadgeProps) {
  return (
    <div className="score-badge" aria-label={`${label}: ${score.toFixed(1)}`}>
      <strong>{score.toFixed(1)}</strong>
      <span>{label}</span>
    </div>
  );
}
