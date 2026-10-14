import * as text from "../../../../kit/text.js";
import { LegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

/** How screens and exports show a legacy double opt in ledger. */
export class LegacyDoubleOptInLedgerView {
  codeText: string;
  title: string;
  label: string;
  batchSize: string;
  budgetText: string;
  channel: string;
  updatedAt: string;
  nameText: string;
  pinned: string;
  sendAt: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    label: string,
    batchSize: string,
    budgetText: string,
    channel: string,
    updatedAt: string,
    nameText: string,
    pinned: string,
    sendAt: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.label = label;
    this.batchSize = batchSize;
    this.budgetText = budgetText;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.nameText = nameText;
    this.pinned = pinned;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyDoubleOptInLedgerView(item: LegacyDoubleOptInLedger): LegacyDoubleOptInLedgerView {
  return new LegacyDoubleOptInLedgerView(
    item.code,
    item.title,
    text.truncate(item.label, 120),
    String(item.batchSize),
    item.budget.toFixed(2),
    text.truncate(item.channel, 80),
    String(item.updatedAt),
    item.name,
    `${item.pinned}`,
    String(item.sendAt),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyDoubleOptInLedgerViews(items: LegacyDoubleOptInLedger[]): LegacyDoubleOptInLedgerView[] {
  const views: LegacyDoubleOptInLedgerView[] = [];
  for (const item of items) {
    views.push(toLegacyDoubleOptInLedgerView(item));
  }
  return views;
}

export function sumLegacyDoubleOptInLedgerView(view: LegacyDoubleOptInLedgerView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBatchSize + parsedBudget + parsedUpdatedAt;
}
