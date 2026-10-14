import * as text from "../../../../kit/text.js";
import { RewardRuleSegment } from "./reward-rule-segment.js";

/** How screens and exports show a reward rule segment. */
export class RewardRuleSegmentView {
  codeText: string;
  name: string;
  channelText: string;
  contactEmailText: string;
  source: string;
  active: string;
  frequencyCap: string;
  graceDays: string;
  clicks: string;
  ratioText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    channelText: string,
    contactEmailText: string,
    source: string,
    active: string,
    frequencyCap: string,
    graceDays: string,
    clicks: string,
    ratioText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.channelText = channelText;
    this.contactEmailText = contactEmailText;
    this.source = source;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.ratioText = ratioText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleSegmentView(item: RewardRuleSegment): RewardRuleSegmentView {
  return new RewardRuleSegmentView(
    text.truncate(item.code, 40),
    item.name,
    text.truncate(item.channel, 80),
    item.contactEmail,
    item.source,
    `${item.active}`,
    String(item.frequencyCap),
    String(item.graceDays),
    String(item.clicks),
    item.ratio.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleSegmentViews(items: RewardRuleSegment[]): RewardRuleSegmentView[] {
  const views: RewardRuleSegmentView[] = [];
  for (const item of items) {
    views.push(toRewardRuleSegmentView(item));
  }
  return views;
}

export function sumRewardRuleSegmentView(view: RewardRuleSegmentView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedFrequencyCap + parsedGraceDays + parsedClicks;
}
