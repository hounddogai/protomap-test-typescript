import { CreditEntry } from "./credit-entry.js";

/** How screens and exports show a credit entry. */
export class CreditEntryView {
  code: string;
  labelText: string;
  conversionRate: string;
  ownerId: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    conversionRate: string,
    ownerId: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.conversionRate = conversionRate;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toCreditEntryView(item: CreditEntry): CreditEntryView {
  return new CreditEntryView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    item.ownerId,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditEntryViews(items: CreditEntry[]): CreditEntryView[] {
  const views: CreditEntryView[] = [];
  for (const item of items) {
    views.push(toCreditEntryView(item));
  }
  return views;
}

export function sumCreditEntryView(view: CreditEntryView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedConversionRate + parsedAttempts;
}
