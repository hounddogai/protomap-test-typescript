import * as text from "../../../../kit/text.js";
import { TierRule } from "./tier-rule.js";

/** How screens and exports show a tier rule. */
export class TierRuleView {
  codeText: string;
  labelText: string;
  updatedAt: string;
  channelText: string;
  rate: string;
  activeText: string;
  journeyId: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    updatedAt: string,
    channelText: string,
    rate: string,
    activeText: string,
    journeyId: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.updatedAt = updatedAt;
    this.channelText = channelText;
    this.rate = rate;
    this.activeText = activeText;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toTierRuleView(item: TierRule): TierRuleView {
  return new TierRuleView(
    item.code,
    text.truncate(item.label, 64),
    String(item.updatedAt),
    text.truncate(item.channel, 40),
    item.rate.toFixed(2),
    `${item.active}`,
    text.truncate(item.journeyId, 40),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierRuleViews(items: TierRule[]): TierRuleView[] {
  const views: TierRuleView[] = [];
  for (const item of items) {
    views.push(toTierRuleView(item));
  }
  return views;
}

export function sumTierRuleView(view: TierRuleView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedUpdatedAt + parsedRate + parsedFrequencyCap;
}
