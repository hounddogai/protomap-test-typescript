import * as text from "../../../../kit/text.js";
import { InsightNotice } from "./insight-notice.js";

/** How screens and exports show a insight notice. */
export class InsightNoticeView {
  code: string;
  title: string;
  expiresAt: string;
  cohortText: string;
  openRate: string;
  revision: string;
  segment: string;
  sequence: string;
  channelText: string;
  startsAt: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAt: string,
    cohortText: string,
    openRate: string,
    revision: string,
    segment: string,
    sequence: string,
    channelText: string,
    startsAt: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.cohortText = cohortText;
    this.openRate = openRate;
    this.revision = revision;
    this.segment = segment;
    this.sequence = sequence;
    this.channelText = channelText;
    this.startsAt = startsAt;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toInsightNoticeView(item: InsightNotice): InsightNoticeView {
  return new InsightNoticeView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 80),
    String(item.expiresAt),
    item.cohort,
    item.openRate.toFixed(2),
    String(item.revision),
    item.segment,
    String(item.sequence),
    text.truncate(item.channel, 64),
    String(item.startsAt),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightNoticeViews(items: InsightNotice[]): InsightNoticeView[] {
  const views: InsightNoticeView[] = [];
  for (const item of items) {
    views.push(toInsightNoticeView(item));
  }
  return views;
}

export function sumInsightNoticeView(view: InsightNoticeView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedExpiresAt + parsedOpenRate + parsedRevision;
}
