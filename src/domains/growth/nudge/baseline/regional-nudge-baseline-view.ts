import * as text from "../../../../kit/text.js";
import { RegionalNudgeBaseline } from "./regional-nudge-baseline.js";

/** How screens and exports show a regional nudge baseline. */
export class RegionalNudgeBaselineView {
  code: string;
  title: string;
  budget: string;
  utmSource: string;
  clicks: string;
  sendAt: string;
  reviewer: string;
  revision: string;
  archivedText: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    utmSource: string,
    clicks: string,
    sendAt: string,
    reviewer: string,
    revision: string,
    archivedText: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.utmSource = utmSource;
    this.clicks = clicks;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.revision = revision;
    this.archivedText = archivedText;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalNudgeBaselineView(item: RegionalNudgeBaseline): RegionalNudgeBaselineView {
  return new RegionalNudgeBaselineView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    text.truncate(item.utmSource, 40),
    String(item.clicks),
    String(item.sendAt),
    text.truncate(item.reviewer, 64),
    String(item.revision),
    `${item.archived}`,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalNudgeBaselineViews(items: RegionalNudgeBaseline[]): RegionalNudgeBaselineView[] {
  const views: RegionalNudgeBaselineView[] = [];
  for (const item of items) {
    views.push(toRegionalNudgeBaselineView(item));
  }
  return views;
}

export function sumRegionalNudgeBaselineView(view: RegionalNudgeBaselineView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedBudget + parsedClicks + parsedSendAt;
}
