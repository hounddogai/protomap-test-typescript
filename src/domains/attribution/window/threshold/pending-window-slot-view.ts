import * as text from "../../../../kit/text.js";
import { PendingWindowSlot } from "./pending-window-slot.js";

/** How screens and exports show a pending window slot. */
export class PendingWindowSlotView {
  code: string;
  nameText: string;
  locale: string;
  journeyId: string;
  ownerIdText: string;
  checksum: string;
  frequencyCap: string;
  batchSizeText: string;
  capacity: string;
  quantity: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    locale: string,
    journeyId: string,
    ownerIdText: string,
    checksum: string,
    frequencyCap: string,
    batchSizeText: string,
    capacity: string,
    quantity: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.locale = locale;
    this.journeyId = journeyId;
    this.ownerIdText = ownerIdText;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.batchSizeText = batchSizeText;
    this.capacity = capacity;
    this.quantity = quantity;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPendingWindowSlotView(item: PendingWindowSlot): PendingWindowSlotView {
  return new PendingWindowSlotView(
    text.truncate(item.code, 80),
    item.name,
    item.locale,
    item.journeyId,
    text.truncate(item.ownerId, 120),
    item.checksum,
    String(item.frequencyCap),
    String(item.batchSize),
    String(item.capacity),
    String(item.quantity),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingWindowSlotViews(items: PendingWindowSlot[]): PendingWindowSlotView[] {
  const views: PendingWindowSlotView[] = [];
  for (const item of items) {
    views.push(toPendingWindowSlotView(item));
  }
  return views;
}

export function sumPendingWindowSlotView(view: PendingWindowSlotView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedFrequencyCap + parsedBatchSize + parsedCapacity;
}
