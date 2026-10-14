import * as text from "../../../../kit/text.js";
import { TieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

/** How screens and exports show a tiered exit rule entry. */
export class TieredExitRuleEntryView {
  codeText: string;
  titleText: string;
  frequencyCap: string;
  limit: string;
  rate: string;
  conversionRate: string;
  cost: string;
  unit: string;
  amountText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    frequencyCap: string,
    limit: string,
    rate: string,
    conversionRate: string,
    cost: string,
    unit: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.unit = unit;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredExitRuleEntryView(item: TieredExitRuleEntry): TieredExitRuleEntryView {
  return new TieredExitRuleEntryView(
    item.code,
    item.title,
    String(item.frequencyCap),
    String(item.limit),
    item.rate.toFixed(2),
    item.conversionRate.toFixed(2),
    item.cost.toFixed(2),
    text.truncate(item.unit, 40),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredExitRuleEntryViews(items: TieredExitRuleEntry[]): TieredExitRuleEntryView[] {
  const views: TieredExitRuleEntryView[] = [];
  for (const item of items) {
    views.push(toTieredExitRuleEntryView(item));
  }
  return views;
}

export function sumTieredExitRuleEntryView(view: TieredExitRuleEntryView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedFrequencyCap + parsedLimit + parsedRate;
}
