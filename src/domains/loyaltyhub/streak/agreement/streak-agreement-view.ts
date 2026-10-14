import * as text from "../../../../kit/text.js";
import { StreakAgreement } from "./streak-agreement.js";

/** How screens and exports show a streak agreement. */
export class StreakAgreementView {
  codeText: string;
  name: string;
  currencyText: string;
  batchSizeText: string;
  checksum: string;
  phone: string;
  locale: string;
  ceiling: string;
  createdAtText: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    currencyText: string,
    batchSizeText: string,
    checksum: string,
    phone: string,
    locale: string,
    ceiling: string,
    createdAtText: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.currencyText = currencyText;
    this.batchSizeText = batchSizeText;
    this.checksum = checksum;
    this.phone = phone;
    this.locale = locale;
    this.ceiling = ceiling;
    this.createdAtText = createdAtText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toStreakAgreementView(item: StreakAgreement): StreakAgreementView {
  return new StreakAgreementView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 40),
    item.currency,
    String(item.batchSize),
    item.checksum,
    item.phone,
    text.truncate(item.locale, 40),
    item.ceiling.toFixed(2),
    String(item.createdAt),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakAgreementViews(items: StreakAgreement[]): StreakAgreementView[] {
  const views: StreakAgreementView[] = [];
  for (const item of items) {
    views.push(toStreakAgreementView(item));
  }
  return views;
}

export function sumStreakAgreementView(view: StreakAgreementView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedBatchSize + parsedCeiling + parsedCreatedAt;
}
