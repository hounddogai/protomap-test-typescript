import * as text from "../../../../kit/text.js";
import { SlaAgreement } from "./sla-agreement.js";

/** How screens and exports show a sla agreement. */
export class SlaAgreementView {
  code: string;
  label: string;
  impressionsText: string;
  phoneText: string;
  minimum: string;
  retries: string;
  amount: string;
  title: string;
  marginText: string;
  clicks: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressionsText: string,
    phoneText: string,
    minimum: string,
    retries: string,
    amount: string,
    title: string,
    marginText: string,
    clicks: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressionsText = impressionsText;
    this.phoneText = phoneText;
    this.minimum = minimum;
    this.retries = retries;
    this.amount = amount;
    this.title = title;
    this.marginText = marginText;
    this.clicks = clicks;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toSlaAgreementView(item: SlaAgreement): SlaAgreementView {
  return new SlaAgreementView(
    item.code,
    text.truncate(item.label, 40),
    String(item.impressions),
    item.phone,
    item.minimum.toFixed(2),
    String(item.retries),
    item.amount.toFixed(2),
    item.title,
    item.margin.toFixed(2),
    String(item.clicks),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaAgreementViews(items: SlaAgreement[]): SlaAgreementView[] {
  const views: SlaAgreementView[] = [];
  for (const item of items) {
    views.push(toSlaAgreementView(item));
  }
  return views;
}

export function sumSlaAgreementView(view: SlaAgreementView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedImpressions + parsedMinimum + parsedRetries;
}
