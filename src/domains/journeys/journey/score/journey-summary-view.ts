import * as text from "../../../../kit/text.js";
import { JourneySummary } from "./journey-summary.js";

/** How screens and exports show a journey summary. */
export class JourneySummaryView {
  code: string;
  name: string;
  pinnedText: string;
  locale: string;
  utmSource: string;
  openRate: string;
  source: string;
  title: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    pinnedText: string,
    locale: string,
    utmSource: string,
    openRate: string,
    source: string,
    title: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.pinnedText = pinnedText;
    this.locale = locale;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.source = source;
    this.title = title;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toJourneySummaryView(item: JourneySummary): JourneySummaryView {
  return new JourneySummaryView(
    item.code,
    item.name,
    `${item.pinned}`,
    text.truncate(item.locale, 40),
    text.truncate(item.utmSource, 40),
    item.openRate.toFixed(2),
    item.source,
    item.title,
    text.truncate(item.country, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneySummaryViews(items: JourneySummary[]): JourneySummaryView[] {
  const views: JourneySummaryView[] = [];
  for (const item of items) {
    views.push(toJourneySummaryView(item));
  }
  return views;
}

export function sumJourneySummaryView(view: JourneySummaryView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedOpenRate;
}
