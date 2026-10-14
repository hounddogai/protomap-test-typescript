import * as text from "../../../../kit/text.js";
import { DomainProfile } from "./domain-profile.js";

/** How screens and exports show a domain profile. */
export class DomainProfileView {
  codeText: string;
  label: string;
  category: string;
  revisionText: string;
  bid: string;
  name: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    category: string,
    revisionText: string,
    bid: string,
    name: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.category = category;
    this.revisionText = revisionText;
    this.bid = bid;
    this.name = name;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toDomainProfileView(item: DomainProfile): DomainProfileView {
  return new DomainProfileView(
    text.truncate(item.code, 40),
    item.label,
    item.category,
    String(item.revision),
    item.bid.toFixed(2),
    item.name,
    text.truncate(item.locale, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainProfileViews(items: DomainProfile[]): DomainProfileView[] {
  const views: DomainProfileView[] = [];
  for (const item of items) {
    views.push(toDomainProfileView(item));
  }
  return views;
}

export function sumDomainProfileView(view: DomainProfileView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRevision + parsedBid;
}
