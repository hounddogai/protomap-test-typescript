import * as text from "../../../../kit/text.js";
import { CappedMentionPolicy } from "./capped-mention-policy.js";

/** How screens and exports show a capped mention policy. */
export class CappedMentionPolicyView {
  code: string;
  nameText: string;
  budget: string;
  sequence: string;
  revision: string;
  updatedAt: string;
  frequencyCap: string;
  bid: string;
  country: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    sequence: string,
    revision: string,
    updatedAt: string,
    frequencyCap: string,
    bid: string,
    country: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.sequence = sequence;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.country = country;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedMentionPolicyView(item: CappedMentionPolicy): CappedMentionPolicyView {
  return new CappedMentionPolicyView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    item.budget.toFixed(2),
    String(item.sequence),
    String(item.revision),
    String(item.updatedAt),
    String(item.frequencyCap),
    item.bid.toFixed(2),
    item.country,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedMentionPolicyViews(items: CappedMentionPolicy[]): CappedMentionPolicyView[] {
  const views: CappedMentionPolicyView[] = [];
  for (const item of items) {
    views.push(toCappedMentionPolicyView(item));
  }
  return views;
}

export function sumCappedMentionPolicyView(view: CappedMentionPolicyView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBudget + parsedSequence + parsedRevision;
}
