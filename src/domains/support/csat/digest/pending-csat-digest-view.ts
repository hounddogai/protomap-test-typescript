import * as text from "../../../../kit/text.js";
import { PendingCsatDigest } from "./pending-csat-digest.js";

/** How screens and exports show a pending csat digest. */
export class PendingCsatDigestView {
  code: string;
  labelText: string;
  descriptionText: string;
  activeText: string;
  minimum: string;
  currencyText: string;
  retries: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    descriptionText: string,
    activeText: string,
    minimum: string,
    currencyText: string,
    retries: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.descriptionText = descriptionText;
    this.activeText = activeText;
    this.minimum = minimum;
    this.currencyText = currencyText;
    this.retries = retries;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCsatDigestView(item: PendingCsatDigest): PendingCsatDigestView {
  return new PendingCsatDigestView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    item.description,
    `${item.active}`,
    item.minimum.toFixed(2),
    item.currency,
    String(item.retries),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCsatDigestViews(items: PendingCsatDigest[]): PendingCsatDigestView[] {
  const views: PendingCsatDigestView[] = [];
  for (const item of items) {
    views.push(toPendingCsatDigestView(item));
  }
  return views;
}

export function sumPendingCsatDigestView(view: PendingCsatDigestView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedMinimum + parsedRetries + parsedCreatedAt;
}
