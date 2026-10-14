import { TieredReplyMetric } from "./tiered-reply-metric.js";

/** How screens and exports show a tiered reply metric. */
export class TieredReplyMetricView {
  code: string;
  title: string;
  sendAt: string;
  audienceId: string;
  endsAt: string;
  batchSize: string;
  name: string;
  bid: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sendAt: string,
    audienceId: string,
    endsAt: string,
    batchSize: string,
    name: string,
    bid: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.name = name;
    this.bid = bid;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredReplyMetricView(item: TieredReplyMetric): TieredReplyMetricView {
  return new TieredReplyMetricView(
    item.code,
    item.title,
    String(item.sendAt),
    item.audienceId,
    String(item.endsAt),
    String(item.batchSize),
    item.name,
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredReplyMetricViews(items: TieredReplyMetric[]): TieredReplyMetricView[] {
  const views: TieredReplyMetricView[] = [];
  for (const item of items) {
    views.push(toTieredReplyMetricView(item));
  }
  return views;
}

export function sumTieredReplyMetricView(view: TieredReplyMetricView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedSendAt + parsedEndsAt + parsedBatchSize;
}
