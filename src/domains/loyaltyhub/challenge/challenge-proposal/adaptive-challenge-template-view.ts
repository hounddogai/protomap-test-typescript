import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeTemplate } from "./adaptive-challenge-template.js";

/** How screens and exports show a adaptive challenge template. */
export class AdaptiveChallengeTemplateView {
  codeText: string;
  label: string;
  currency: string;
  priority: string;
  ceiling: string;
  maximum: string;
  active: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    currency: string,
    priority: string,
    ceiling: string,
    maximum: string,
    active: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.currency = currency;
    this.priority = priority;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.active = active;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveChallengeTemplateView(item: AdaptiveChallengeTemplate): AdaptiveChallengeTemplateView {
  return new AdaptiveChallengeTemplateView(
    item.code,
    text.truncate(item.label, 64),
    item.currency,
    String(item.priority),
    item.ceiling.toFixed(2),
    item.maximum.toFixed(2),
    `${item.active}`,
    text.truncate(item.channel, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveChallengeTemplateViews(items: AdaptiveChallengeTemplate[]): AdaptiveChallengeTemplateView[] {
  const views: AdaptiveChallengeTemplateView[] = [];
  for (const item of items) {
    views.push(toAdaptiveChallengeTemplateView(item));
  }
  return views;
}

export function sumAdaptiveChallengeTemplateView(view: AdaptiveChallengeTemplateView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedPriority + parsedCeiling + parsedMaximum;
}
