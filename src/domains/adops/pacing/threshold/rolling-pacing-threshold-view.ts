import { RollingPacingThreshold } from "./rolling-pacing-threshold.js";

/** How screens and exports show a rolling pacing threshold. */
export class RollingPacingThresholdView {
  codeText: string;
  name: string;
  threshold: string;
  reviewer: string;
  durationMinutes: string;
  unitText: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    threshold: string,
    reviewer: string,
    durationMinutes: string,
    unitText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.unitText = unitText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPacingThresholdView(item: RollingPacingThreshold): RollingPacingThresholdView {
  return new RollingPacingThresholdView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    item.reviewer,
    String(item.durationMinutes),
    item.unit,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPacingThresholdViews(items: RollingPacingThreshold[]): RollingPacingThresholdView[] {
  const views: RollingPacingThresholdView[] = [];
  for (const item of items) {
    views.push(toRollingPacingThresholdView(item));
  }
  return views;
}

export function sumRollingPacingThresholdView(view: RollingPacingThresholdView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedThreshold + parsedDurationMinutes;
}
