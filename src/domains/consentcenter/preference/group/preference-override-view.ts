import * as text from "../../../../kit/text.js";
import { PreferenceOverride } from "./preference-override.js";

/** How screens and exports show a preference override. */
export class PreferenceOverrideView {
  code: string;
  labelText: string;
  archived: string;
  summaryText: string;
  sendAt: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    archived: string,
    summaryText: string,
    sendAt: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.archived = archived;
    this.summaryText = summaryText;
    this.sendAt = sendAt;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceOverrideView(item: PreferenceOverride): PreferenceOverrideView {
  return new PreferenceOverrideView(
    item.code,
    text.truncate(item.label, 64),
    `${item.archived}`,
    text.truncate(item.summary, 80),
    String(item.sendAt),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceOverrideViews(items: PreferenceOverride[]): PreferenceOverrideView[] {
  const views: PreferenceOverrideView[] = [];
  for (const item of items) {
    views.push(toPreferenceOverrideView(item));
  }
  return views;
}

export function sumPreferenceOverrideView(view: PreferenceOverrideView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
