import { ManualInsightAdjustment } from "./manual-insight-adjustment.js";

/** How screens and exports show a manual insight adjustment. */
export class ManualInsightAdjustmentView {
  codeText: string;
  title: string;
  capacityText: string;
  graceDaysText: string;
  attempts: string;
  region: string;
  score: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    capacityText: string,
    graceDaysText: string,
    attempts: string,
    region: string,
    score: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.capacityText = capacityText;
    this.graceDaysText = graceDaysText;
    this.attempts = attempts;
    this.region = region;
    this.score = score;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toManualInsightAdjustmentView(item: ManualInsightAdjustment): ManualInsightAdjustmentView {
  return new ManualInsightAdjustmentView(
    item.code,
    item.title,
    String(item.capacity),
    String(item.graceDays),
    String(item.attempts),
    item.region,
    item.score.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualInsightAdjustmentViews(items: ManualInsightAdjustment[]): ManualInsightAdjustmentView[] {
  const views: ManualInsightAdjustmentView[] = [];
  for (const item of items) {
    views.push(toManualInsightAdjustmentView(item));
  }
  return views;
}

export function sumManualInsightAdjustmentView(view: ManualInsightAdjustmentView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedCapacity + parsedGraceDays + parsedAttempts;
}
