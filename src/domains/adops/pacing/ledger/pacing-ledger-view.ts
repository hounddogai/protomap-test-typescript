import * as text from "../../../../kit/text.js";
import { PacingLedger } from "./pacing-ledger.js";

/** How screens and exports show a pacing ledger. */
export class PacingLedgerView {
  code: string;
  nameText: string;
  startsAtText: string;
  score: string;
  source: string;
  limit: string;
  bid: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    startsAtText: string,
    score: string,
    source: string,
    limit: string,
    bid: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.startsAtText = startsAtText;
    this.score = score;
    this.source = source;
    this.limit = limit;
    this.bid = bid;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toPacingLedgerView(item: PacingLedger): PacingLedgerView {
  return new PacingLedgerView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    String(item.startsAt),
    item.score.toFixed(2),
    item.source,
    String(item.limit),
    item.bid.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingLedgerViews(items: PacingLedger[]): PacingLedgerView[] {
  const views: PacingLedgerView[] = [];
  for (const item of items) {
    views.push(toPacingLedgerView(item));
  }
  return views;
}

export function sumPacingLedgerView(view: PacingLedgerView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedStartsAt + parsedScore + parsedLimit;
}
