import * as text from "../../../../kit/text.js";
import { PrimaryPathDraft } from "./primary-path-draft.js";

/** How screens and exports show a primary path draft. */
export class PrimaryPathDraftView {
  code: string;
  titleText: string;
  cohort: string;
  expiresAt: string;
  locale: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    cohort: string,
    expiresAt: string,
    locale: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPathDraftView(item: PrimaryPathDraft): PrimaryPathDraftView {
  return new PrimaryPathDraftView(
    text.truncate(item.code, 40),
    item.title,
    item.cohort,
    String(item.expiresAt),
    text.truncate(item.locale, 64),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPathDraftViews(items: PrimaryPathDraft[]): PrimaryPathDraftView[] {
  const views: PrimaryPathDraftView[] = [];
  for (const item of items) {
    views.push(toPrimaryPathDraftView(item));
  }
  return views;
}

export function sumPrimaryPathDraftView(view: PrimaryPathDraftView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedExpiresAt + parsedConversionRate;
}
