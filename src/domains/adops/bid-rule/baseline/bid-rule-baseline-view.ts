import * as text from "../../../../kit/text.js";
import { BidRuleBaseline } from "./bid-rule-baseline.js";

/** How screens and exports show a bid rule baseline. */
export class BidRuleBaselineView {
  code: string;
  nameText: string;
  description: string;
  audienceId: string;
  startsAt: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    description: string,
    audienceId: string,
    startsAt: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.description = description;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleBaselineView(item: BidRuleBaseline): BidRuleBaselineView {
  return new BidRuleBaselineView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.description, 80),
    item.audienceId,
    String(item.startsAt),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleBaselineViews(items: BidRuleBaseline[]): BidRuleBaselineView[] {
  const views: BidRuleBaselineView[] = [];
  for (const item of items) {
    views.push(toBidRuleBaselineView(item));
  }
  return views;
}

export function sumBidRuleBaselineView(view: BidRuleBaselineView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedStartsAt + parsedFrequencyCap;
}
