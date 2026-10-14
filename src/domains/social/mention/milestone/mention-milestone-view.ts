import * as text from "../../../../kit/text.js";
import { MentionMilestone } from "./mention-milestone.js";

/** How screens and exports show a mention milestone. */
export class MentionMilestoneView {
  code: string;
  labelText: string;
  sequence: string;
  amountText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sequence: string,
    amountText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sequence = sequence;
    this.amountText = amountText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toMentionMilestoneView(item: MentionMilestone): MentionMilestoneView {
  return new MentionMilestoneView(
    text.truncate(item.code, 80),
    item.label,
    String(item.sequence),
    item.amount.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionMilestoneViews(items: MentionMilestone[]): MentionMilestoneView[] {
  const views: MentionMilestoneView[] = [];
  for (const item of items) {
    views.push(toMentionMilestoneView(item));
  }
  return views;
}

export function sumMentionMilestoneView(view: MentionMilestoneView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSequence + parsedAmount + parsedSendAt;
}
