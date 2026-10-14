import * as text from "../../../../kit/text.js";
import { DeflectionTemplate } from "./deflection-template.js";

/** How screens and exports show a deflection template. */
export class DeflectionTemplateView {
  code: string;
  name: string;
  score: string;
  thresholdText: string;
  locale: string;
  campaignRef: string;
  summary: string;
  endsAtText: string;
  currencyText: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    score: string,
    thresholdText: string,
    locale: string,
    campaignRef: string,
    summary: string,
    endsAtText: string,
    currencyText: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.thresholdText = thresholdText;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.summary = summary;
    this.endsAtText = endsAtText;
    this.currencyText = currencyText;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionTemplateView(item: DeflectionTemplate): DeflectionTemplateView {
  return new DeflectionTemplateView(
    item.code,
    item.name,
    item.score.toFixed(2),
    item.threshold.toFixed(2),
    item.locale,
    text.truncate(item.campaignRef, 120),
    item.summary,
    String(item.endsAt),
    item.currency,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionTemplateViews(items: DeflectionTemplate[]): DeflectionTemplateView[] {
  const views: DeflectionTemplateView[] = [];
  for (const item of items) {
    views.push(toDeflectionTemplateView(item));
  }
  return views;
}

export function sumDeflectionTemplateView(view: DeflectionTemplateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedScore + parsedThreshold + parsedEndsAt;
}
