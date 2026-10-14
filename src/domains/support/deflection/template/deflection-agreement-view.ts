import * as text from "../../../../kit/text.js";
import { DeflectionAgreement } from "./deflection-agreement.js";

/** How screens and exports show a deflection agreement. */
export class DeflectionAgreementView {
  codeText: string;
  name: string;
  channel: string;
  currencyText: string;
  batchSize: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    channel: string,
    currencyText: string,
    batchSize: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.channel = channel;
    this.currencyText = currencyText;
    this.batchSize = batchSize;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionAgreementView(item: DeflectionAgreement): DeflectionAgreementView {
  return new DeflectionAgreementView(
    item.code,
    item.name,
    text.truncate(item.channel, 40),
    item.currency,
    String(item.batchSize),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionAgreementViews(items: DeflectionAgreement[]): DeflectionAgreementView[] {
  const views: DeflectionAgreementView[] = [];
  for (const item of items) {
    views.push(toDeflectionAgreementView(item));
  }
  return views;
}

export function sumDeflectionAgreementView(view: DeflectionAgreementView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedBatchSize + parsedExpiresAt;
}
