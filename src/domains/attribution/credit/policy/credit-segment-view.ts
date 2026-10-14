import * as text from "../../../../kit/text.js";
import { CreditSegment } from "./credit-segment.js";

/** How screens and exports show a credit segment. */
export class CreditSegmentView {
  code: string;
  title: string;
  audienceIdText: string;
  amount: string;
  contactEmail: string;
  locale: string;
  descriptionText: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceIdText: string,
    amount: string,
    contactEmail: string,
    locale: string,
    descriptionText: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceIdText = audienceIdText;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.locale = locale;
    this.descriptionText = descriptionText;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toCreditSegmentView(item: CreditSegment): CreditSegmentView {
  return new CreditSegmentView(
    item.code,
    text.truncate(item.title, 120),
    item.audienceId,
    item.amount.toFixed(2),
    item.contactEmail,
    text.truncate(item.locale, 64),
    item.description,
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditSegmentViews(items: CreditSegment[]): CreditSegmentView[] {
  const views: CreditSegmentView[] = [];
  for (const item of items) {
    views.push(toCreditSegmentView(item));
  }
  return views;
}

export function sumCreditSegmentView(view: CreditSegmentView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
