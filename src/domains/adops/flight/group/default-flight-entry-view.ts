import * as text from "../../../../kit/text.js";
import { DefaultFlightEntry } from "./default-flight-entry.js";

/** How screens and exports show a default flight entry. */
export class DefaultFlightEntryView {
  code: string;
  titleText: string;
  createdAt: string;
  region: string;
  segment: string;
  audienceId: string;
  locale: string;
  sourceText: string;
  ownerIdText: string;
  revision: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    createdAt: string,
    region: string,
    segment: string,
    audienceId: string,
    locale: string,
    sourceText: string,
    ownerIdText: string,
    revision: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.createdAt = createdAt;
    this.region = region;
    this.segment = segment;
    this.audienceId = audienceId;
    this.locale = locale;
    this.sourceText = sourceText;
    this.ownerIdText = ownerIdText;
    this.revision = revision;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFlightEntryView(item: DefaultFlightEntry): DefaultFlightEntryView {
  return new DefaultFlightEntryView(
    text.truncate(item.code, 80),
    item.title,
    String(item.createdAt),
    item.region,
    item.segment,
    item.audienceId,
    item.locale,
    item.source,
    item.ownerId,
    String(item.revision),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFlightEntryViews(items: DefaultFlightEntry[]): DefaultFlightEntryView[] {
  const views: DefaultFlightEntryView[] = [];
  for (const item of items) {
    views.push(toDefaultFlightEntryView(item));
  }
  return views;
}

export function sumDefaultFlightEntryView(view: DefaultFlightEntryView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedCreatedAt + parsedRevision + parsedLimit;
}
