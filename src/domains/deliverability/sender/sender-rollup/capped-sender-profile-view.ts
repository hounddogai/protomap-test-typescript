import * as text from "../../../../kit/text.js";
import { CappedSenderProfile } from "./capped-sender-profile.js";

/** How screens and exports show a capped sender profile. */
export class CappedSenderProfileView {
  codeText: string;
  name: string;
  source: string;
  attemptsText: string;
  bid: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    source: string,
    attemptsText: string,
    bid: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.source = source;
    this.attemptsText = attemptsText;
    this.bid = bid;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSenderProfileView(item: CappedSenderProfile): CappedSenderProfileView {
  return new CappedSenderProfileView(
    item.code,
    item.name,
    text.truncate(item.source, 120),
    String(item.attempts),
    item.bid.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSenderProfileViews(items: CappedSenderProfile[]): CappedSenderProfileView[] {
  const views: CappedSenderProfileView[] = [];
  for (const item of items) {
    views.push(toCappedSenderProfileView(item));
  }
  return views;
}

export function sumCappedSenderProfileView(view: CappedSenderProfileView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedAttempts + parsedBid + parsedMargin;
}
