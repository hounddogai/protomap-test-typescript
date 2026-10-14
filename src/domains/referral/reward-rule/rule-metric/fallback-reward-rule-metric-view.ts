import * as text from "../../../../kit/text.js";
import { FallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

/** How screens and exports show a fallback reward rule metric. */
export class FallbackRewardRuleMetricView {
  codeText: string;
  nameText: string;
  unit: string;
  threshold: string;
  summary: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    unit: string,
    threshold: string,
    summary: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.unit = unit;
    this.threshold = threshold;
    this.summary = summary;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackRewardRuleMetricView(item: FallbackRewardRuleMetric): FallbackRewardRuleMetricView {
  return new FallbackRewardRuleMetricView(
    item.code,
    text.truncate(item.name, 120),
    text.truncate(item.unit, 120),
    item.threshold.toFixed(2),
    item.summary,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackRewardRuleMetricViews(items: FallbackRewardRuleMetric[]): FallbackRewardRuleMetricView[] {
  const views: FallbackRewardRuleMetricView[] = [];
  for (const item of items) {
    views.push(toFallbackRewardRuleMetricView(item));
  }
  return views;
}

export function sumFallbackRewardRuleMetricView(view: FallbackRewardRuleMetricView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
