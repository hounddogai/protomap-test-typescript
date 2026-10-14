import { WeightedEscalationVariance } from "./weighted-escalation-variance.js";

/** How screens and exports show a weighted escalation variance. */
export class WeightedEscalationVarianceView {
  codeText: string;
  label: string;
  cohort: string;
  sourceText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    cohort: string,
    sourceText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.cohort = cohort;
    this.sourceText = sourceText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedEscalationVarianceView(item: WeightedEscalationVariance): WeightedEscalationVarianceView {
  return new WeightedEscalationVarianceView(
    item.code,
    item.label,
    item.cohort,
    item.source,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedEscalationVarianceViews(items: WeightedEscalationVariance[]): WeightedEscalationVarianceView[] {
  const views: WeightedEscalationVarianceView[] = [];
  for (const item of items) {
    views.push(toWeightedEscalationVarianceView(item));
  }
  return views;
}

export function sumWeightedEscalationVarianceView(view: WeightedEscalationVarianceView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
