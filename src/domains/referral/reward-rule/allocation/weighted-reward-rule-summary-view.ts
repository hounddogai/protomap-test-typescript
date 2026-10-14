import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

/** How screens and exports show a weighted reward rule summary. */
export class WeightedRewardRuleSummaryView {
  code: string;
  label: string;
  channel: string;
  clicks: string;
  unit: string;
  frequencyCap: string;
  expiresAt: string;
  floorValue: string;
  journeyIdText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    clicks: string,
    unit: string,
    frequencyCap: string,
    expiresAt: string,
    floorValue: string,
    journeyIdText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.clicks = clicks;
    this.unit = unit;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.floorValue = floorValue;
    this.journeyIdText = journeyIdText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardRuleSummaryView(item: WeightedRewardRuleSummary): WeightedRewardRuleSummaryView {
  return new WeightedRewardRuleSummaryView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    text.truncate(item.channel, 120),
    String(item.clicks),
    item.unit,
    String(item.frequencyCap),
    String(item.expiresAt),
    item.floorValue.toFixed(2),
    text.truncate(item.journeyId, 64),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardRuleSummaryViews(items: WeightedRewardRuleSummary[]): WeightedRewardRuleSummaryView[] {
  const views: WeightedRewardRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardRuleSummaryView(item));
  }
  return views;
}

export function sumWeightedRewardRuleSummaryView(view: WeightedRewardRuleSummaryView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedClicks + parsedFrequencyCap + parsedExpiresAt;
}
