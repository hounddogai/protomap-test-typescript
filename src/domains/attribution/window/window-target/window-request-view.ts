import * as text from "../../../../kit/text.js";
import { WindowRequest } from "./window-request.js";

/** How screens and exports show a window request. */
export class WindowRequestView {
  codeText: string;
  titleText: string;
  attempts: string;
  budget: string;
  audienceIdText: string;
  graceDays: string;
  impressions: string;
  campaignRefText: string;
  reviewerText: string;
  batchSize: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    attempts: string,
    budget: string,
    audienceIdText: string,
    graceDays: string,
    impressions: string,
    campaignRefText: string,
    reviewerText: string,
    batchSize: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.attempts = attempts;
    this.budget = budget;
    this.audienceIdText = audienceIdText;
    this.graceDays = graceDays;
    this.impressions = impressions;
    this.campaignRefText = campaignRefText;
    this.reviewerText = reviewerText;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toWindowRequestView(item: WindowRequest): WindowRequestView {
  return new WindowRequestView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 120),
    String(item.attempts),
    item.budget.toFixed(2),
    item.audienceId,
    String(item.graceDays),
    String(item.impressions),
    item.campaignRef,
    item.reviewer,
    String(item.batchSize),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowRequestViews(items: WindowRequest[]): WindowRequestView[] {
  const views: WindowRequestView[] = [];
  for (const item of items) {
    views.push(toWindowRequestView(item));
  }
  return views;
}

export function sumWindowRequestView(view: WindowRequestView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedAttempts + parsedBudget + parsedGraceDays;
}
