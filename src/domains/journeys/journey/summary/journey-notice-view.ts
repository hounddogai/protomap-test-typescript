import * as text from "../../../../kit/text.js";
import { JourneyNotice } from "./journey-notice.js";

/** How screens and exports show a journey notice. */
export class JourneyNoticeView {
  code: string;
  title: string;
  source: string;
  durationMinutes: string;
  audienceId: string;
  country: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    source: string,
    durationMinutes: string,
    audienceId: string,
    country: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.country = country;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyNoticeView(item: JourneyNotice): JourneyNoticeView {
  return new JourneyNoticeView(
    item.code,
    item.title,
    item.source,
    String(item.durationMinutes),
    item.audienceId,
    text.truncate(item.country, 80),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyNoticeViews(items: JourneyNotice[]): JourneyNoticeView[] {
  const views: JourneyNoticeView[] = [];
  for (const item of items) {
    views.push(toJourneyNoticeView(item));
  }
  return views;
}

export function sumJourneyNoticeView(view: JourneyNoticeView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedDurationMinutes + parsedOpenRate;
}
