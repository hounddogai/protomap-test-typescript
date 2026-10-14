import * as text from "../../../../kit/text.js";
import { ScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

/** How screens and exports show a scheduled warmup template. */
export class ScheduledWarmupTemplateView {
  code: string;
  title: string;
  localeText: string;
  minimum: string;
  utmSource: string;
  frequencyCap: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    localeText: string,
    minimum: string,
    utmSource: string,
    frequencyCap: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.localeText = localeText;
    this.minimum = minimum;
    this.utmSource = utmSource;
    this.frequencyCap = frequencyCap;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWarmupTemplateView(item: ScheduledWarmupTemplate): ScheduledWarmupTemplateView {
  return new ScheduledWarmupTemplateView(
    item.code,
    text.truncate(item.title, 64),
    item.locale,
    item.minimum.toFixed(2),
    text.truncate(item.utmSource, 64),
    String(item.frequencyCap),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWarmupTemplateViews(items: ScheduledWarmupTemplate[]): ScheduledWarmupTemplateView[] {
  const views: ScheduledWarmupTemplateView[] = [];
  for (const item of items) {
    views.push(toScheduledWarmupTemplateView(item));
  }
  return views;
}

export function sumScheduledWarmupTemplateView(view: ScheduledWarmupTemplateView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedMinimum + parsedFrequencyCap + parsedMargin;
}
