import * as text from "../../../../kit/text.js";
import { PrimaryStepEntry } from "./primary-step-entry.js";

/** How screens and exports show a primary step entry. */
export class PrimaryStepEntryView {
  code: string;
  name: string;
  summary: string;
  openRateText: string;
  frequencyCap: string;
  phoneText: string;
  timezone: string;
  amountText: string;
  margin: string;
  batchSize: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    summary: string,
    openRateText: string,
    frequencyCap: string,
    phoneText: string,
    timezone: string,
    amountText: string,
    margin: string,
    batchSize: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.openRateText = openRateText;
    this.frequencyCap = frequencyCap;
    this.phoneText = phoneText;
    this.timezone = timezone;
    this.amountText = amountText;
    this.margin = margin;
    this.batchSize = batchSize;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryStepEntryView(item: PrimaryStepEntry): PrimaryStepEntryView {
  return new PrimaryStepEntryView(
    text.truncate(item.code, 120),
    item.name,
    item.summary,
    item.openRate.toFixed(2),
    String(item.frequencyCap),
    item.phone,
    item.timezone,
    item.amount.toFixed(2),
    item.margin.toFixed(2),
    String(item.batchSize),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryStepEntryViews(items: PrimaryStepEntry[]): PrimaryStepEntryView[] {
  const views: PrimaryStepEntryView[] = [];
  for (const item of items) {
    views.push(toPrimaryStepEntryView(item));
  }
  return views;
}

export function sumPrimaryStepEntryView(view: PrimaryStepEntryView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedOpenRate + parsedFrequencyCap + parsedAmount;
}
