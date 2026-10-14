import { WeightedMentionCycle } from "./weighted-mention-cycle.js";

/** How screens and exports show a weighted mention cycle. */
export class WeightedMentionCycleView {
  code: string;
  label: string;
  source: string;
  utmSourceText: string;
  channel: string;
  localeText: string;
  threshold: string;
  segment: string;
  summaryText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    source: string,
    utmSourceText: string,
    channel: string,
    localeText: string,
    threshold: string,
    segment: string,
    summaryText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.utmSourceText = utmSourceText;
    this.channel = channel;
    this.localeText = localeText;
    this.threshold = threshold;
    this.segment = segment;
    this.summaryText = summaryText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedMentionCycleView(item: WeightedMentionCycle): WeightedMentionCycleView {
  return new WeightedMentionCycleView(
    item.code,
    item.label,
    item.source,
    item.utmSource,
    item.channel,
    item.locale,
    item.threshold.toFixed(2),
    item.segment,
    item.summary,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedMentionCycleViews(items: WeightedMentionCycle[]): WeightedMentionCycleView[] {
  const views: WeightedMentionCycleView[] = [];
  for (const item of items) {
    views.push(toWeightedMentionCycleView(item));
  }
  return views;
}

export function sumWeightedMentionCycleView(view: WeightedMentionCycleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
