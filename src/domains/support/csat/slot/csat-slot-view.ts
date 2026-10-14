import * as text from "../../../../kit/text.js";
import { CsatSlot } from "./csat-slot.js";

/** How screens and exports show a csat slot. */
export class CsatSlotView {
  code: string;
  name: string;
  checksum: string;
  ownerId: string;
  externalRef: string;
  archived: string;
  capacity: string;
  openRate: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    checksum: string,
    ownerId: string,
    externalRef: string,
    archived: string,
    capacity: string,
    openRate: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
    this.archived = archived;
    this.capacity = capacity;
    this.openRate = openRate;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toCsatSlotView(item: CsatSlot): CsatSlotView {
  return new CsatSlotView(
    text.truncate(item.code, 120),
    item.name,
    item.checksum,
    text.truncate(item.ownerId, 40),
    item.externalRef,
    `${item.archived}`,
    String(item.capacity),
    item.openRate.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatSlotViews(items: CsatSlot[]): CsatSlotView[] {
  const views: CsatSlotView[] = [];
  for (const item of items) {
    views.push(toCsatSlotView(item));
  }
  return views;
}

export function sumCsatSlotView(view: CsatSlotView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedCapacity + parsedOpenRate + parsedRetries;
}
