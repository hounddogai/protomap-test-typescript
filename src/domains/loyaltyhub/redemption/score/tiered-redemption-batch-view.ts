import { TieredRedemptionBatch } from "./tiered-redemption-batch.js";

/** How screens and exports show a tiered redemption batch. */
export class TieredRedemptionBatchView {
  code: string;
  label: string;
  endsAt: string;
  checksum: string;
  floorValueText: string;
  marginText: string;
  amountText: string;
  openRate: string;
  channel: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAt: string,
    checksum: string,
    floorValueText: string,
    marginText: string,
    amountText: string,
    openRate: string,
    channel: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.checksum = checksum;
    this.floorValueText = floorValueText;
    this.marginText = marginText;
    this.amountText = amountText;
    this.openRate = openRate;
    this.channel = channel;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRedemptionBatchView(item: TieredRedemptionBatch): TieredRedemptionBatchView {
  return new TieredRedemptionBatchView(
    item.code,
    item.label,
    String(item.endsAt),
    item.checksum,
    item.floorValue.toFixed(2),
    item.margin.toFixed(2),
    item.amount.toFixed(2),
    item.openRate.toFixed(2),
    item.channel,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRedemptionBatchViews(items: TieredRedemptionBatch[]): TieredRedemptionBatchView[] {
  const views: TieredRedemptionBatchView[] = [];
  for (const item of items) {
    views.push(toTieredRedemptionBatchView(item));
  }
  return views;
}

export function sumTieredRedemptionBatchView(view: TieredRedemptionBatchView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedEndsAt + parsedFloorValue + parsedMargin;
}
