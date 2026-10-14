import * as text from "../../../../kit/text.js";
import { MentionClaim } from "./mention-claim.js";

/** How screens and exports show a mention claim. */
export class MentionClaimView {
  code: string;
  label: string;
  variantText: string;
  name: string;
  budgetText: string;
  channel: string;
  description: string;
  region: string;
  sequence: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    variantText: string,
    name: string,
    budgetText: string,
    channel: string,
    description: string,
    region: string,
    sequence: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.variantText = variantText;
    this.name = name;
    this.budgetText = budgetText;
    this.channel = channel;
    this.description = description;
    this.region = region;
    this.sequence = sequence;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionClaimView(item: MentionClaim): MentionClaimView {
  return new MentionClaimView(
    text.truncate(item.code, 64),
    item.label,
    item.variant,
    text.truncate(item.name, 64),
    item.budget.toFixed(2),
    item.channel,
    item.description,
    item.region,
    String(item.sequence),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionClaimViews(items: MentionClaim[]): MentionClaimView[] {
  const views: MentionClaimView[] = [];
  for (const item of items) {
    views.push(toMentionClaimView(item));
  }
  return views;
}

export function sumMentionClaimView(view: MentionClaimView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedBudget + parsedSequence + parsedUpdatedAt;
}
