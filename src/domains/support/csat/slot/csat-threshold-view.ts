import * as text from "../../../../kit/text.js";
import { CsatThreshold } from "./csat-threshold.js";

/** How screens and exports show a csat threshold. */
export class CsatThresholdView {
  code: string;
  nameText: string;
  phone: string;
  weightText: string;
  amountText: string;
  rateText: string;
  contactEmail: string;
  categoryText: string;
  ratio: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    phone: string,
    weightText: string,
    amountText: string,
    rateText: string,
    contactEmail: string,
    categoryText: string,
    ratio: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.phone = phone;
    this.weightText = weightText;
    this.amountText = amountText;
    this.rateText = rateText;
    this.contactEmail = contactEmail;
    this.categoryText = categoryText;
    this.ratio = ratio;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toCsatThresholdView(item: CsatThreshold): CsatThresholdView {
  return new CsatThresholdView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    item.phone,
    item.weight.toFixed(2),
    item.amount.toFixed(2),
    item.rate.toFixed(2),
    item.contactEmail,
    item.category,
    item.ratio.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatThresholdViews(items: CsatThreshold[]): CsatThresholdView[] {
  const views: CsatThresholdView[] = [];
  for (const item of items) {
    views.push(toCsatThresholdView(item));
  }
  return views;
}

export function sumCsatThresholdView(view: CsatThresholdView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedWeight + parsedAmount + parsedRate;
}
