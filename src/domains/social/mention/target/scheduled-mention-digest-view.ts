import * as text from "../../../../kit/text.js";
import { ScheduledMentionDigest } from "./scheduled-mention-digest.js";

/** How screens and exports show a scheduled mention digest. */
export class ScheduledMentionDigestView {
  codeText: string;
  label: string;
  title: string;
  campaignRef: string;
  visible: string;
  attempts: string;
  pinned: string;
  threshold: string;
  description: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    title: string,
    campaignRef: string,
    visible: string,
    attempts: string,
    pinned: string,
    threshold: string,
    description: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.title = title;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.attempts = attempts;
    this.pinned = pinned;
    this.threshold = threshold;
    this.description = description;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledMentionDigestView(item: ScheduledMentionDigest): ScheduledMentionDigestView {
  return new ScheduledMentionDigestView(
    text.truncate(item.code, 80),
    item.label,
    item.title,
    item.campaignRef,
    `${item.visible}`,
    String(item.attempts),
    `${item.pinned}`,
    item.threshold.toFixed(2),
    item.description,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledMentionDigestViews(items: ScheduledMentionDigest[]): ScheduledMentionDigestView[] {
  const views: ScheduledMentionDigestView[] = [];
  for (const item of items) {
    views.push(toScheduledMentionDigestView(item));
  }
  return views;
}

export function sumScheduledMentionDigestView(view: ScheduledMentionDigestView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedAttempts + parsedThreshold + parsedCost;
}
