import * as text from "../../../../kit/text.js";
import { TieredRewardRuleOverride } from "./tiered-reward-rule-override.js";

/** How screens and exports show a tiered reward rule override. */
export class TieredRewardRuleOverrideView {
  code: string;
  labelText: string;
  margin: string;
  frequencyCap: string;
  timezoneText: string;
  source: string;
  ownerId: string;
  durationMinutes: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    margin: string,
    frequencyCap: string,
    timezoneText: string,
    source: string,
    ownerId: string,
    durationMinutes: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.timezoneText = timezoneText;
    this.source = source;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardRuleOverrideView(item: TieredRewardRuleOverride): TieredRewardRuleOverrideView {
  return new TieredRewardRuleOverrideView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    String(item.frequencyCap),
    text.truncate(item.timezone, 40),
    text.truncate(item.source, 40),
    item.ownerId,
    String(item.durationMinutes),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardRuleOverrideViews(items: TieredRewardRuleOverride[]): TieredRewardRuleOverrideView[] {
  const views: TieredRewardRuleOverrideView[] = [];
  for (const item of items) {
    views.push(toTieredRewardRuleOverrideView(item));
  }
  return views;
}

export function sumTieredRewardRuleOverrideView(view: TieredRewardRuleOverrideView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedMargin + parsedFrequencyCap + parsedDurationMinutes;
}
