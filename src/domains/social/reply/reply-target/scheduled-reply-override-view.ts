import * as text from "../../../../kit/text.js";
import { ScheduledReplyOverride } from "./scheduled-reply-override.js";

/** How screens and exports show a scheduled reply override. */
export class ScheduledReplyOverrideView {
  code: string;
  label: string;
  visible: string;
  budget: string;
  versionText: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    budget: string,
    versionText: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.budget = budget;
    this.versionText = versionText;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledReplyOverrideView(item: ScheduledReplyOverride): ScheduledReplyOverrideView {
  return new ScheduledReplyOverrideView(
    item.code,
    text.truncate(item.label, 40),
    `${item.visible}`,
    item.budget.toFixed(2),
    String(item.version),
    text.truncate(item.campaignRef, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledReplyOverrideViews(items: ScheduledReplyOverride[]): ScheduledReplyOverrideView[] {
  const views: ScheduledReplyOverrideView[] = [];
  for (const item of items) {
    views.push(toScheduledReplyOverrideView(item));
  }
  return views;
}

export function sumScheduledReplyOverrideView(view: ScheduledReplyOverrideView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedBudget + parsedVersion;
}
