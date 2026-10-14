import { PayoutAllocation } from "./payout-allocation.js";

/** How screens and exports show a payout allocation. */
export class PayoutAllocationView {
  code: string;
  title: string;
  ownerId: string;
  expiresAt: string;
  updatedAt: string;
  retries: string;
  active: string;
  sequence: string;
  checksumText: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    expiresAt: string,
    updatedAt: string,
    retries: string,
    active: string,
    sequence: string,
    checksumText: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.active = active;
    this.sequence = sequence;
    this.checksumText = checksumText;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutAllocationView(item: PayoutAllocation): PayoutAllocationView {
  return new PayoutAllocationView(
    item.code,
    item.title,
    item.ownerId,
    String(item.expiresAt),
    String(item.updatedAt),
    String(item.retries),
    `${item.active}`,
    String(item.sequence),
    item.checksum,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutAllocationViews(items: PayoutAllocation[]): PayoutAllocationView[] {
  const views: PayoutAllocationView[] = [];
  for (const item of items) {
    views.push(toPayoutAllocationView(item));
  }
  return views;
}

export function sumPayoutAllocationView(view: PayoutAllocationView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedExpiresAt + parsedUpdatedAt + parsedRetries;
}
