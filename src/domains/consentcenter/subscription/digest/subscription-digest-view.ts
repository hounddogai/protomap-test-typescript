import { SubscriptionDigest } from "./subscription-digest.js";

/** How screens and exports show a subscription digest. */
export class SubscriptionDigestView {
  code: string;
  nameText: string;
  weight: string;
  source: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    weight: string,
    source: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.weight = weight;
    this.source = source;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionDigestView(item: SubscriptionDigest): SubscriptionDigestView {
  return new SubscriptionDigestView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    item.source,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionDigestViews(items: SubscriptionDigest[]): SubscriptionDigestView[] {
  const views: SubscriptionDigestView[] = [];
  for (const item of items) {
    views.push(toSubscriptionDigestView(item));
  }
  return views;
}

export function sumSubscriptionDigestView(view: SubscriptionDigestView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedWeight + parsedCapacity;
}
