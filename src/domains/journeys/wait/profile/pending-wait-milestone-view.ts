import * as text from "../../../../kit/text.js";
import { PendingWaitMilestone } from "./pending-wait-milestone.js";

/** How screens and exports show a pending wait milestone. */
export class PendingWaitMilestoneView {
  code: string;
  titleText: string;
  locale: string;
  openRate: string;
  expiresAtText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    locale: string,
    openRate: string,
    expiresAtText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.locale = locale;
    this.openRate = openRate;
    this.expiresAtText = expiresAtText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingWaitMilestoneView(item: PendingWaitMilestone): PendingWaitMilestoneView {
  return new PendingWaitMilestoneView(
    item.code,
    text.truncate(item.title, 64),
    text.truncate(item.locale, 40),
    item.openRate.toFixed(2),
    String(item.expiresAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingWaitMilestoneViews(items: PendingWaitMilestone[]): PendingWaitMilestoneView[] {
  const views: PendingWaitMilestoneView[] = [];
  for (const item of items) {
    views.push(toPendingWaitMilestoneView(item));
  }
  return views;
}

export function sumPendingWaitMilestoneView(view: PendingWaitMilestoneView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedOpenRate + parsedExpiresAt + parsedClicks;
}
