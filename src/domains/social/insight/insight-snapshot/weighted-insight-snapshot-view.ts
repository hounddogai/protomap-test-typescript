import { WeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

/** How screens and exports show a weighted insight snapshot. */
export class WeightedInsightSnapshotView {
  code: string;
  label: string;
  revision: string;
  impressionsText: string;
  attempts: string;
  name: string;
  budget: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    impressionsText: string,
    attempts: string,
    name: string,
    budget: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.impressionsText = impressionsText;
    this.attempts = attempts;
    this.name = name;
    this.budget = budget;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedInsightSnapshotView(item: WeightedInsightSnapshot): WeightedInsightSnapshotView {
  return new WeightedInsightSnapshotView(
    item.code,
    item.label,
    String(item.revision),
    String(item.impressions),
    String(item.attempts),
    item.name,
    item.budget.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedInsightSnapshotViews(items: WeightedInsightSnapshot[]): WeightedInsightSnapshotView[] {
  const views: WeightedInsightSnapshotView[] = [];
  for (const item of items) {
    views.push(toWeightedInsightSnapshotView(item));
  }
  return views;
}

export function sumWeightedInsightSnapshotView(view: WeightedInsightSnapshotView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedRevision + parsedImpressions + parsedAttempts;
}
