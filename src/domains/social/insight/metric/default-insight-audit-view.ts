import * as text from "../../../../kit/text.js";
import { DefaultInsightAudit } from "./default-insight-audit.js";

/** How screens and exports show a default insight audit. */
export class DefaultInsightAuditView {
  code: string;
  titleText: string;
  bid: string;
  batchSize: string;
  durationMinutes: string;
  channelText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    bid: string,
    batchSize: string,
    durationMinutes: string,
    channelText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.bid = bid;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
    this.channelText = channelText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultInsightAuditView(item: DefaultInsightAudit): DefaultInsightAuditView {
  return new DefaultInsightAuditView(
    item.code,
    text.truncate(item.title, 80),
    item.bid.toFixed(2),
    String(item.batchSize),
    String(item.durationMinutes),
    item.channel,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultInsightAuditViews(items: DefaultInsightAudit[]): DefaultInsightAuditView[] {
  const views: DefaultInsightAuditView[] = [];
  for (const item of items) {
    views.push(toDefaultInsightAuditView(item));
  }
  return views;
}

export function sumDefaultInsightAuditView(view: DefaultInsightAuditView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedBid + parsedBatchSize + parsedDurationMinutes;
}
