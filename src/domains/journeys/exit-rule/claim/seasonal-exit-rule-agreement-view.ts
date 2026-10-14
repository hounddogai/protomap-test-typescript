import * as text from "../../../../kit/text.js";
import { SeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

/** How screens and exports show a seasonal exit rule agreement. */
export class SeasonalExitRuleAgreementView {
  code: string;
  titleText: string;
  frequencyCap: string;
  externalRef: string;
  limit: string;
  bid: string;
  segment: string;
  floorValueText: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    frequencyCap: string,
    externalRef: string,
    limit: string,
    bid: string,
    segment: string,
    floorValueText: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.externalRef = externalRef;
    this.limit = limit;
    this.bid = bid;
    this.segment = segment;
    this.floorValueText = floorValueText;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalExitRuleAgreementView(item: SeasonalExitRuleAgreement): SeasonalExitRuleAgreementView {
  return new SeasonalExitRuleAgreementView(
    item.code,
    item.title,
    String(item.frequencyCap),
    item.externalRef,
    String(item.limit),
    item.bid.toFixed(2),
    text.truncate(item.segment, 80),
    item.floorValue.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalExitRuleAgreementViews(items: SeasonalExitRuleAgreement[]): SeasonalExitRuleAgreementView[] {
  const views: SeasonalExitRuleAgreementView[] = [];
  for (const item of items) {
    views.push(toSeasonalExitRuleAgreementView(item));
  }
  return views;
}

export function sumSeasonalExitRuleAgreementView(view: SeasonalExitRuleAgreementView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedFrequencyCap + parsedLimit + parsedBid;
}
