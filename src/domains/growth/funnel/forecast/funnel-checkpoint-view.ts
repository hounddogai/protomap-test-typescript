import { FunnelCheckpoint } from "./funnel-checkpoint.js";

/** How screens and exports show a funnel checkpoint. */
export class FunnelCheckpointView {
  code: string;
  labelText: string;
  discountText: string;
  maximumText: string;
  checksumText: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    discountText: string,
    maximumText: string,
    checksumText: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.discountText = discountText;
    this.maximumText = maximumText;
    this.checksumText = checksumText;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelCheckpointView(item: FunnelCheckpoint): FunnelCheckpointView {
  return new FunnelCheckpointView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    item.maximum.toFixed(2),
    item.checksum,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelCheckpointViews(items: FunnelCheckpoint[]): FunnelCheckpointView[] {
  const views: FunnelCheckpointView[] = [];
  for (const item of items) {
    views.push(toFunnelCheckpointView(item));
  }
  return views;
}

export function sumFunnelCheckpointView(view: FunnelCheckpointView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedDiscount + parsedMaximum + parsedEndsAt;
}
