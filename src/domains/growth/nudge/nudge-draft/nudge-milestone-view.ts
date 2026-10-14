import * as text from "../../../../kit/text.js";
import { NudgeMilestone } from "./nudge-milestone.js";

/** How screens and exports show a nudge milestone. */
export class NudgeMilestoneView {
  code: string;
  label: string;
  sendAt: string;
  channel: string;
  variantText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAt: string,
    channel: string,
    variantText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.channel = channel;
    this.variantText = variantText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeMilestoneView(item: NudgeMilestone): NudgeMilestoneView {
  return new NudgeMilestoneView(
    text.truncate(item.code, 120),
    item.label,
    String(item.sendAt),
    item.channel,
    item.variant,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeMilestoneViews(items: NudgeMilestone[]): NudgeMilestoneView[] {
  const views: NudgeMilestoneView[] = [];
  for (const item of items) {
    views.push(toNudgeMilestoneView(item));
  }
  return views;
}

export function sumNudgeMilestoneView(view: NudgeMilestoneView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedSendAt + parsedAttempts;
}
