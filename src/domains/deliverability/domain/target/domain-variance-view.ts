import * as text from "../../../../kit/text.js";
import { DomainVariance } from "./domain-variance.js";

/** How screens and exports show a domain variance. */
export class DomainVarianceView {
  codeText: string;
  titleText: string;
  locale: string;
  summary: string;
  notes: string;
  checksum: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    locale: string,
    summary: string,
    notes: string,
    checksum: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.locale = locale;
    this.summary = summary;
    this.notes = notes;
    this.checksum = checksum;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toDomainVarianceView(item: DomainVariance): DomainVarianceView {
  return new DomainVarianceView(
    item.code,
    item.title,
    item.locale,
    item.summary,
    item.notes,
    text.truncate(item.checksum, 64),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainVarianceViews(items: DomainVariance[]): DomainVarianceView[] {
  const views: DomainVarianceView[] = [];
  for (const item of items) {
    views.push(toDomainVarianceView(item));
  }
  return views;
}

export function sumDomainVarianceView(view: DomainVarianceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
