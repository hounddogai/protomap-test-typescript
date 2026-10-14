import * as text from "../../../../kit/text.js";
import { SeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

/** How screens and exports show a seasonal paywall schedule. */
export class SeasonalPaywallScheduleView {
  code: string;
  label: string;
  thresholdText: string;
  variant: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    thresholdText: string,
    variant: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.thresholdText = thresholdText;
    this.variant = variant;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPaywallScheduleView(item: SeasonalPaywallSchedule): SeasonalPaywallScheduleView {
  return new SeasonalPaywallScheduleView(
    text.truncate(item.code, 64),
    item.label,
    item.threshold.toFixed(2),
    item.variant,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPaywallScheduleViews(items: SeasonalPaywallSchedule[]): SeasonalPaywallScheduleView[] {
  const views: SeasonalPaywallScheduleView[] = [];
  for (const item of items) {
    views.push(toSeasonalPaywallScheduleView(item));
  }
  return views;
}

export function sumSeasonalPaywallScheduleView(view: SeasonalPaywallScheduleView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedThreshold + parsedBatchSize;
}
