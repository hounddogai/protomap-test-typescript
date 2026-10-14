import * as text from "../../../../kit/text.js";
import { MentionTarget } from "./mention-target.js";

/** How screens and exports show a mention target. */
export class MentionTargetView {
  code: string;
  title: string;
  budget: string;
  clicks: string;
  retries: string;
  openRateText: string;
  phone: string;
  graceDaysText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    clicks: string,
    retries: string,
    openRateText: string,
    phone: string,
    graceDaysText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.clicks = clicks;
    this.retries = retries;
    this.openRateText = openRateText;
    this.phone = phone;
    this.graceDaysText = graceDaysText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionTargetView(item: MentionTarget): MentionTargetView {
  return new MentionTargetView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    String(item.clicks),
    String(item.retries),
    item.openRate.toFixed(2),
    text.truncate(item.phone, 64),
    String(item.graceDays),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionTargetViews(items: MentionTarget[]): MentionTargetView[] {
  const views: MentionTargetView[] = [];
  for (const item of items) {
    views.push(toMentionTargetView(item));
  }
  return views;
}

export function sumMentionTargetView(view: MentionTargetView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBudget + parsedClicks + parsedRetries;
}
