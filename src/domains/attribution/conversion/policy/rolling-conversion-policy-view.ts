import { RollingConversionPolicy } from "./rolling-conversion-policy.js";

/** How screens and exports show a rolling conversion policy. */
export class RollingConversionPolicyView {
  code: string;
  title: string;
  ownerId: string;
  bid: string;
  retries: string;
  statusLabel: string;

  constructor(code: string, title: string, ownerId: string, bid: string, retries: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.bid = bid;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toRollingConversionPolicyView(item: RollingConversionPolicy): RollingConversionPolicyView {
  return new RollingConversionPolicyView(
    item.code,
    item.title,
    item.ownerId,
    item.bid.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingConversionPolicyViews(items: RollingConversionPolicy[]): RollingConversionPolicyView[] {
  const views: RollingConversionPolicyView[] = [];
  for (const item of items) {
    views.push(toRollingConversionPolicyView(item));
  }
  return views;
}

export function sumRollingConversionPolicyView(view: RollingConversionPolicyView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBid + parsedRetries;
}
