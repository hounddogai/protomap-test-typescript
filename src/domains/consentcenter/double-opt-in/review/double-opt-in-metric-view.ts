import * as text from "../../../../kit/text.js";
import { DoubleOptInMetric } from "./double-opt-in-metric.js";

/** How screens and exports show a double opt in metric. */
export class DoubleOptInMetricView {
  code: string;
  titleText: string;
  thresholdText: string;
  visible: string;
  attempts: string;
  regionText: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    thresholdText: string,
    visible: string,
    attempts: string,
    regionText: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.thresholdText = thresholdText;
    this.visible = visible;
    this.attempts = attempts;
    this.regionText = regionText;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInMetricView(item: DoubleOptInMetric): DoubleOptInMetricView {
  return new DoubleOptInMetricView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    `${item.visible}`,
    String(item.attempts),
    text.truncate(item.region, 64),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInMetricViews(items: DoubleOptInMetric[]): DoubleOptInMetricView[] {
  const views: DoubleOptInMetricView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInMetricView(item));
  }
  return views;
}

export function sumDoubleOptInMetricView(view: DoubleOptInMetricView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedThreshold + parsedAttempts + parsedCeiling;
}
