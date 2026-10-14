import { PendingBidRuleSegment } from "./pending-bid-rule-segment.js";

/** How screens and exports show a pending bid rule segment. */
export class PendingBidRuleSegmentView {
  codeText: string;
  titleText: string;
  journeyIdText: string;
  archived: string;
  impressions: string;
  batchSize: string;
  floorValue: string;
  revision: string;
  sendAt: string;
  channelText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    journeyIdText: string,
    archived: string,
    impressions: string,
    batchSize: string,
    floorValue: string,
    revision: string,
    sendAt: string,
    channelText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.journeyIdText = journeyIdText;
    this.archived = archived;
    this.impressions = impressions;
    this.batchSize = batchSize;
    this.floorValue = floorValue;
    this.revision = revision;
    this.sendAt = sendAt;
    this.channelText = channelText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBidRuleSegmentView(item: PendingBidRuleSegment): PendingBidRuleSegmentView {
  return new PendingBidRuleSegmentView(
    item.code,
    item.title,
    item.journeyId,
    `${item.archived}`,
    String(item.impressions),
    String(item.batchSize),
    item.floorValue.toFixed(2),
    String(item.revision),
    String(item.sendAt),
    item.channel,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBidRuleSegmentViews(items: PendingBidRuleSegment[]): PendingBidRuleSegmentView[] {
  const views: PendingBidRuleSegmentView[] = [];
  for (const item of items) {
    views.push(toPendingBidRuleSegmentView(item));
  }
  return views;
}

export function sumPendingBidRuleSegmentView(view: PendingBidRuleSegmentView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedImpressions + parsedBatchSize + parsedFloorValue;
}
