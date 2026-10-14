import * as text from "../../../../kit/text.js";
import { ScheduledEscalationAdjustment } from "./scheduled-escalation-adjustment.js";

/** How screens and exports show a scheduled escalation adjustment. */
export class ScheduledEscalationAdjustmentView {
  codeText: string;
  nameText: string;
  score: string;
  campaignRefText: string;
  pinned: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    score: string,
    campaignRefText: string,
    pinned: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.score = score;
    this.campaignRefText = campaignRefText;
    this.pinned = pinned;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledEscalationAdjustmentView(item: ScheduledEscalationAdjustment): ScheduledEscalationAdjustmentView {
  return new ScheduledEscalationAdjustmentView(
    item.code,
    text.truncate(item.name, 40),
    item.score.toFixed(2),
    item.campaignRef,
    `${item.pinned}`,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledEscalationAdjustmentViews(items: ScheduledEscalationAdjustment[]): ScheduledEscalationAdjustmentView[] {
  const views: ScheduledEscalationAdjustmentView[] = [];
  for (const item of items) {
    views.push(toScheduledEscalationAdjustmentView(item));
  }
  return views;
}

export function sumScheduledEscalationAdjustmentView(view: ScheduledEscalationAdjustmentView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
