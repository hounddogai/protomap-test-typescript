import * as text from "../../../../kit/text.js";
import { CsatMapping } from "./csat-mapping.js";

/** How screens and exports show a csat mapping. */
export class CsatMappingView {
  codeText: string;
  name: string;
  locale: string;
  attempts: string;
  bid: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    locale: string,
    attempts: string,
    bid: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.locale = locale;
    this.attempts = attempts;
    this.bid = bid;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toCsatMappingView(item: CsatMapping): CsatMappingView {
  return new CsatMappingView(
    text.truncate(item.code, 120),
    item.name,
    item.locale,
    String(item.attempts),
    item.bid.toFixed(2),
    text.truncate(item.reviewer, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatMappingViews(items: CsatMapping[]): CsatMappingView[] {
  const views: CsatMappingView[] = [];
  for (const item of items) {
    views.push(toCsatMappingView(item));
  }
  return views;
}

export function sumCsatMappingView(view: CsatMappingView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedAttempts + parsedBid;
}
