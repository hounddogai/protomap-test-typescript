import { WeightedNudgeMetric } from "./weighted-nudge-metric.js";

/** How screens and exports show a weighted nudge metric. */
export class WeightedNudgeMetricView {
  codeText: string;
  nameText: string;
  threshold: string;
  channel: string;
  windowDays: string;
  openRateText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    threshold: string,
    channel: string,
    windowDays: string,
    openRateText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.threshold = threshold;
    this.channel = channel;
    this.windowDays = windowDays;
    this.openRateText = openRateText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedNudgeMetricView(item: WeightedNudgeMetric): WeightedNudgeMetricView {
  return new WeightedNudgeMetricView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    item.channel,
    String(item.windowDays),
    item.openRate.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedNudgeMetricViews(items: WeightedNudgeMetric[]): WeightedNudgeMetricView[] {
  const views: WeightedNudgeMetricView[] = [];
  for (const item of items) {
    views.push(toWeightedNudgeMetricView(item));
  }
  return views;
}

export function sumWeightedNudgeMetricView(view: WeightedNudgeMetricView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedThreshold + parsedWindowDays + parsedOpenRate;
}
