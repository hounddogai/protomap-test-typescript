import * as text from "../../../../kit/text.js";
import { JourneyAudit } from "./journey-audit.js";

/** How screens and exports show a journey audit. */
export class JourneyAuditView {
  code: string;
  name: string;
  priority: string;
  locale: string;
  archived: string;
  clicks: string;
  segment: string;
  retriesText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priority: string,
    locale: string,
    archived: string,
    clicks: string,
    segment: string,
    retriesText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.locale = locale;
    this.archived = archived;
    this.clicks = clicks;
    this.segment = segment;
    this.retriesText = retriesText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyAuditView(item: JourneyAudit): JourneyAuditView {
  return new JourneyAuditView(
    text.truncate(item.code, 120),
    item.name,
    String(item.priority),
    text.truncate(item.locale, 64),
    `${item.archived}`,
    String(item.clicks),
    text.truncate(item.segment, 64),
    String(item.retries),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyAuditViews(items: JourneyAudit[]): JourneyAuditView[] {
  const views: JourneyAuditView[] = [];
  for (const item of items) {
    views.push(toJourneyAuditView(item));
  }
  return views;
}

export function sumJourneyAuditView(view: JourneyAuditView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedPriority + parsedClicks + parsedRetries;
}
