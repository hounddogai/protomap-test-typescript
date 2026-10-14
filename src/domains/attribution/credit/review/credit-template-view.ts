import * as text from "../../../../kit/text.js";
import { CreditTemplate } from "./credit-template.js";

/** How screens and exports show a credit template. */
export class CreditTemplateView {
  code: string;
  nameText: string;
  externalRef: string;
  margin: string;
  country: string;
  category: string;
  threshold: string;
  channelText: string;
  summary: string;
  checksum: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    externalRef: string,
    margin: string,
    country: string,
    category: string,
    threshold: string,
    channelText: string,
    summary: string,
    checksum: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.externalRef = externalRef;
    this.margin = margin;
    this.country = country;
    this.category = category;
    this.threshold = threshold;
    this.channelText = channelText;
    this.summary = summary;
    this.checksum = checksum;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditTemplateView(item: CreditTemplate): CreditTemplateView {
  return new CreditTemplateView(
    item.code,
    text.truncate(item.name, 40),
    item.externalRef,
    item.margin.toFixed(2),
    item.country,
    text.truncate(item.category, 80),
    item.threshold.toFixed(2),
    item.channel,
    item.summary,
    text.truncate(item.checksum, 64),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditTemplateViews(items: CreditTemplate[]): CreditTemplateView[] {
  const views: CreditTemplateView[] = [];
  for (const item of items) {
    views.push(toCreditTemplateView(item));
  }
  return views;
}

export function sumCreditTemplateView(view: CreditTemplateView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedMargin + parsedThreshold + parsedOpenRate;
}
