import * as text from "../../../../kit/text.js";
import { ChallengeLedger } from "./challenge-ledger.js";

/** How screens and exports show a challenge ledger. */
export class ChallengeLedgerView {
  code: string;
  nameText: string;
  checksum: string;
  budgetText: string;
  windowDays: string;
  updatedAtText: string;
  sequenceText: string;
  channel: string;
  pinned: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    checksum: string,
    budgetText: string,
    windowDays: string,
    updatedAtText: string,
    sequenceText: string,
    channel: string,
    pinned: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.checksum = checksum;
    this.budgetText = budgetText;
    this.windowDays = windowDays;
    this.updatedAtText = updatedAtText;
    this.sequenceText = sequenceText;
    this.channel = channel;
    this.pinned = pinned;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeLedgerView(item: ChallengeLedger): ChallengeLedgerView {
  return new ChallengeLedgerView(
    text.truncate(item.code, 64),
    item.name,
    item.checksum,
    item.budget.toFixed(2),
    String(item.windowDays),
    String(item.updatedAt),
    String(item.sequence),
    item.channel,
    `${item.pinned}`,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeLedgerViews(items: ChallengeLedger[]): ChallengeLedgerView[] {
  const views: ChallengeLedgerView[] = [];
  for (const item of items) {
    views.push(toChallengeLedgerView(item));
  }
  return views;
}

export function sumChallengeLedgerView(view: ChallengeLedgerView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedBudget + parsedWindowDays + parsedUpdatedAt;
}
