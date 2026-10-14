import * as text from "../../../../kit/text.js";
import { TouchpointOverride } from "./touchpoint-override.js";

/** How screens and exports show a touchpoint override. */
export class TouchpointOverrideView {
  codeText: string;
  label: string;
  updatedAtText: string;
  endsAt: string;
  audienceIdText: string;
  budget: string;
  threshold: string;
  approved: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    updatedAtText: string,
    endsAt: string,
    audienceIdText: string,
    budget: string,
    threshold: string,
    approved: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.updatedAtText = updatedAtText;
    this.endsAt = endsAt;
    this.audienceIdText = audienceIdText;
    this.budget = budget;
    this.threshold = threshold;
    this.approved = approved;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointOverrideView(item: TouchpointOverride): TouchpointOverrideView {
  return new TouchpointOverrideView(
    item.code,
    text.truncate(item.label, 40),
    String(item.updatedAt),
    String(item.endsAt),
    item.audienceId,
    item.budget.toFixed(2),
    item.threshold.toFixed(2),
    `${item.approved}`,
    text.truncate(item.campaignRef, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointOverrideViews(items: TouchpointOverride[]): TouchpointOverrideView[] {
  const views: TouchpointOverrideView[] = [];
  for (const item of items) {
    views.push(toTouchpointOverrideView(item));
  }
  return views;
}

export function sumTouchpointOverrideView(view: TouchpointOverrideView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedUpdatedAt + parsedEndsAt + parsedBudget;
}
