import * as text from "../../../../kit/text.js";
import { BouncePreference } from "./bounce-preference.js";

/** How screens and exports show a bounce preference. */
export class BouncePreferenceView {
  codeText: string;
  label: string;
  locale: string;
  budgetText: string;
  openRateText: string;
  campaignRef: string;
  createdAtText: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    locale: string,
    budgetText: string,
    openRateText: string,
    campaignRef: string,
    createdAtText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.locale = locale;
    this.budgetText = budgetText;
    this.openRateText = openRateText;
    this.campaignRef = campaignRef;
    this.createdAtText = createdAtText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toBouncePreferenceView(item: BouncePreference): BouncePreferenceView {
  return new BouncePreferenceView(
    text.truncate(item.code, 80),
    item.label,
    item.locale,
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.campaignRef,
    String(item.createdAt),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toBouncePreferenceViews(items: BouncePreference[]): BouncePreferenceView[] {
  const views: BouncePreferenceView[] = [];
  for (const item of items) {
    views.push(toBouncePreferenceView(item));
  }
  return views;
}

export function sumBouncePreferenceView(view: BouncePreferenceView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedBudget + parsedOpenRate + parsedCreatedAt;
}
