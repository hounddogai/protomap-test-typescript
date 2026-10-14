import { ScheduledStreakTemplate } from "./scheduled-streak-template.js";

/** How screens and exports show a scheduled streak template. */
export class ScheduledStreakTemplateView {
  codeText: string;
  labelText: string;
  title: string;
  frequencyCap: string;
  source: string;
  openRateText: string;
  timezone: string;
  endsAt: string;
  bid: string;
  utmSource: string;
  countryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    title: string,
    frequencyCap: string,
    source: string,
    openRateText: string,
    timezone: string,
    endsAt: string,
    bid: string,
    utmSource: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.openRateText = openRateText;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.bid = bid;
    this.utmSource = utmSource;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledStreakTemplateView(item: ScheduledStreakTemplate): ScheduledStreakTemplateView {
  return new ScheduledStreakTemplateView(
    item.code,
    item.label,
    item.title,
    String(item.frequencyCap),
    item.source,
    item.openRate.toFixed(2),
    item.timezone,
    String(item.endsAt),
    item.bid.toFixed(2),
    item.utmSource,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledStreakTemplateViews(items: ScheduledStreakTemplate[]): ScheduledStreakTemplateView[] {
  const views: ScheduledStreakTemplateView[] = [];
  for (const item of items) {
    views.push(toScheduledStreakTemplateView(item));
  }
  return views;
}

export function sumScheduledStreakTemplateView(view: ScheduledStreakTemplateView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedFrequencyCap + parsedOpenRate + parsedEndsAt;
}
