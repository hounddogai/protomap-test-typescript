import { SuppressionCheckpoint } from "./suppression-checkpoint.js";

/** How screens and exports show a suppression checkpoint. */
export class SuppressionCheckpointView {
  codeText: string;
  label: string;
  ceilingText: string;
  frequencyCap: string;
  weightText: string;
  archivedText: string;
  openRate: string;
  budgetText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    ceilingText: string,
    frequencyCap: string,
    weightText: string,
    archivedText: string,
    openRate: string,
    budgetText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.ceilingText = ceilingText;
    this.frequencyCap = frequencyCap;
    this.weightText = weightText;
    this.archivedText = archivedText;
    this.openRate = openRate;
    this.budgetText = budgetText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionCheckpointView(item: SuppressionCheckpoint): SuppressionCheckpointView {
  return new SuppressionCheckpointView(
    item.code,
    item.label,
    item.ceiling.toFixed(2),
    String(item.frequencyCap),
    item.weight.toFixed(2),
    `${item.archived}`,
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionCheckpointViews(items: SuppressionCheckpoint[]): SuppressionCheckpointView[] {
  const views: SuppressionCheckpointView[] = [];
  for (const item of items) {
    views.push(toSuppressionCheckpointView(item));
  }
  return views;
}

export function sumSuppressionCheckpointView(view: SuppressionCheckpointView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedCeiling + parsedFrequencyCap + parsedWeight;
}
