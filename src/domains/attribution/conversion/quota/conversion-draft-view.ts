import * as text from "../../../../kit/text.js";
import { ConversionDraft } from "./conversion-draft.js";

/** How screens and exports show a conversion draft. */
export class ConversionDraftView {
  code: string;
  label: string;
  clicksText: string;
  description: string;
  contactEmailText: string;
  marginText: string;
  budget: string;
  channel: string;
  threshold: string;
  externalRef: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicksText: string,
    description: string,
    contactEmailText: string,
    marginText: string,
    budget: string,
    channel: string,
    threshold: string,
    externalRef: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicksText = clicksText;
    this.description = description;
    this.contactEmailText = contactEmailText;
    this.marginText = marginText;
    this.budget = budget;
    this.channel = channel;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toConversionDraftView(item: ConversionDraft): ConversionDraftView {
  return new ConversionDraftView(
    text.truncate(item.code, 120),
    item.label,
    String(item.clicks),
    text.truncate(item.description, 80),
    item.contactEmail,
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    item.channel,
    item.threshold.toFixed(2),
    item.externalRef,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionDraftViews(items: ConversionDraft[]): ConversionDraftView[] {
  const views: ConversionDraftView[] = [];
  for (const item of items) {
    views.push(toConversionDraftView(item));
  }
  return views;
}

export function sumConversionDraftView(view: ConversionDraftView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedClicks + parsedMargin + parsedBudget;
}
