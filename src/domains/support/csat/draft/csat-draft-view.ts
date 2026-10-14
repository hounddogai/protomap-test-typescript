import * as text from "../../../../kit/text.js";
import { CsatDraft } from "./csat-draft.js";

/** How screens and exports show a csat draft. */
export class CsatDraftView {
  codeText: string;
  label: string;
  localeText: string;
  utmSource: string;
  ratio: string;
  active: string;
  conversionRateText: string;
  maximum: string;
  priority: string;
  sequence: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    localeText: string,
    utmSource: string,
    ratio: string,
    active: string,
    conversionRateText: string,
    maximum: string,
    priority: string,
    sequence: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.localeText = localeText;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.active = active;
    this.conversionRateText = conversionRateText;
    this.maximum = maximum;
    this.priority = priority;
    this.sequence = sequence;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toCsatDraftView(item: CsatDraft): CsatDraftView {
  return new CsatDraftView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.locale, 40),
    text.truncate(item.utmSource, 80),
    item.ratio.toFixed(2),
    `${item.active}`,
    item.conversionRate.toFixed(2),
    item.maximum.toFixed(2),
    String(item.priority),
    String(item.sequence),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatDraftViews(items: CsatDraft[]): CsatDraftView[] {
  const views: CsatDraftView[] = [];
  for (const item of items) {
    views.push(toCsatDraftView(item));
  }
  return views;
}

export function sumCsatDraftView(view: CsatDraftView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedRatio + parsedConversionRate + parsedMaximum;
}
