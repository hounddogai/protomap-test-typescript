import * as text from "../../../../kit/text.js";
import { PendingDomainSnapshot } from "./pending-domain-snapshot.js";

/** How screens and exports show a pending domain snapshot. */
export class PendingDomainSnapshotView {
  code: string;
  titleText: string;
  timezoneText: string;
  discountText: string;
  floorValue: string;
  phone: string;
  capacityText: string;
  batchSizeText: string;
  audienceIdText: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezoneText: string,
    discountText: string,
    floorValue: string,
    phone: string,
    capacityText: string,
    batchSizeText: string,
    audienceIdText: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezoneText = timezoneText;
    this.discountText = discountText;
    this.floorValue = floorValue;
    this.phone = phone;
    this.capacityText = capacityText;
    this.batchSizeText = batchSizeText;
    this.audienceIdText = audienceIdText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toPendingDomainSnapshotView(item: PendingDomainSnapshot): PendingDomainSnapshotView {
  return new PendingDomainSnapshotView(
    text.truncate(item.code, 80),
    item.title,
    item.timezone,
    item.discount.toFixed(2),
    item.floorValue.toFixed(2),
    item.phone,
    String(item.capacity),
    String(item.batchSize),
    item.audienceId,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingDomainSnapshotViews(items: PendingDomainSnapshot[]): PendingDomainSnapshotView[] {
  const views: PendingDomainSnapshotView[] = [];
  for (const item of items) {
    views.push(toPendingDomainSnapshotView(item));
  }
  return views;
}

export function sumPendingDomainSnapshotView(view: PendingDomainSnapshotView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedDiscount + parsedFloorValue + parsedCapacity;
}
