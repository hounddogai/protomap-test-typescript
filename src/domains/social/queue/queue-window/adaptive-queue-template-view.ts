import * as text from "../../../../kit/text.js";
import { AdaptiveQueueTemplate } from "./adaptive-queue-template.js";

/** How screens and exports show a adaptive queue template. */
export class AdaptiveQueueTemplateView {
  code: string;
  label: string;
  channelText: string;
  sendAt: string;
  clicks: string;
  budget: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channelText: string,
    sendAt: string,
    clicks: string,
    budget: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channelText = channelText;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.budget = budget;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveQueueTemplateView(item: AdaptiveQueueTemplate): AdaptiveQueueTemplateView {
  return new AdaptiveQueueTemplateView(
    item.code,
    item.label,
    text.truncate(item.channel, 80),
    String(item.sendAt),
    String(item.clicks),
    item.budget.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveQueueTemplateViews(items: AdaptiveQueueTemplate[]): AdaptiveQueueTemplateView[] {
  const views: AdaptiveQueueTemplateView[] = [];
  for (const item of items) {
    views.push(toAdaptiveQueueTemplateView(item));
  }
  return views;
}

export function sumAdaptiveQueueTemplateView(view: AdaptiveQueueTemplateView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedSendAt + parsedClicks + parsedBudget;
}
