import * as text from "../../../../kit/text.js";
import { SubscriptionLedger } from "./subscription-ledger.js";

/** How screens and exports show a subscription ledger. */
export class SubscriptionLedgerView {
  code: string;
  nameText: string;
  channel: string;
  archived: string;
  createdAt: string;
  threshold: string;
  audienceId: string;
  sequence: string;
  attemptsText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    channel: string,
    archived: string,
    createdAt: string,
    threshold: string,
    audienceId: string,
    sequence: string,
    attemptsText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.channel = channel;
    this.archived = archived;
    this.createdAt = createdAt;
    this.threshold = threshold;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.attemptsText = attemptsText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionLedgerView(item: SubscriptionLedger): SubscriptionLedgerView {
  return new SubscriptionLedgerView(
    text.truncate(item.code, 64),
    item.name,
    item.channel,
    `${item.archived}`,
    String(item.createdAt),
    item.threshold.toFixed(2),
    item.audienceId,
    String(item.sequence),
    String(item.attempts),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionLedgerViews(items: SubscriptionLedger[]): SubscriptionLedgerView[] {
  const views: SubscriptionLedgerView[] = [];
  for (const item of items) {
    views.push(toSubscriptionLedgerView(item));
  }
  return views;
}

export function sumSubscriptionLedgerView(view: SubscriptionLedgerView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCreatedAt + parsedThreshold + parsedSequence;
}
