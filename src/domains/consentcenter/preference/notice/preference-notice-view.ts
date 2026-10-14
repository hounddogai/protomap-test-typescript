import * as text from "../../../../kit/text.js";
import { PreferenceNotice } from "./preference-notice.js";

/** How screens and exports show a preference notice. */
export class PreferenceNoticeView {
  code: string;
  name: string;
  currency: string;
  budget: string;
  channel: string;
  statusLabel: string;

  constructor(code: string, name: string, currency: string, budget: string, channel: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.budget = budget;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceNoticeView(item: PreferenceNotice): PreferenceNoticeView {
  return new PreferenceNoticeView(
    item.code,
    item.name,
    text.truncate(item.currency, 80),
    item.budget.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceNoticeViews(items: PreferenceNotice[]): PreferenceNoticeView[] {
  const views: PreferenceNoticeView[] = [];
  for (const item of items) {
    views.push(toPreferenceNoticeView(item));
  }
  return views;
}

export function sumPreferenceNoticeView(view: PreferenceNoticeView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
