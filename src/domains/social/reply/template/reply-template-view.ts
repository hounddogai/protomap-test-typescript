import * as text from "../../../../kit/text.js";
import { ReplyTemplate } from "./reply-template.js";

/** How screens and exports show a reply template. */
export class ReplyTemplateView {
  code: string;
  label: string;
  weight: string;
  active: string;
  attempts: string;
  sourceText: string;
  currency: string;
  conversionRateText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    active: string,
    attempts: string,
    sourceText: string,
    currency: string,
    conversionRateText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.active = active;
    this.attempts = attempts;
    this.sourceText = sourceText;
    this.currency = currency;
    this.conversionRateText = conversionRateText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toReplyTemplateView(item: ReplyTemplate): ReplyTemplateView {
  return new ReplyTemplateView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    `${item.active}`,
    String(item.attempts),
    text.truncate(item.source, 64),
    item.currency,
    item.conversionRate.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyTemplateViews(items: ReplyTemplate[]): ReplyTemplateView[] {
  const views: ReplyTemplateView[] = [];
  for (const item of items) {
    views.push(toReplyTemplateView(item));
  }
  return views;
}

export function sumReplyTemplateView(view: ReplyTemplateView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedWeight + parsedAttempts + parsedConversionRate;
}
