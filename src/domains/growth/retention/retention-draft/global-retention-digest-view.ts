import { GlobalRetentionDigest } from "./global-retention-digest.js";

/** How screens and exports show a global retention digest. */
export class GlobalRetentionDigestView {
  code: string;
  name: string;
  active: string;
  cohortText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    active: string,
    cohortText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.cohortText = cohortText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRetentionDigestView(item: GlobalRetentionDigest): GlobalRetentionDigestView {
  return new GlobalRetentionDigestView(
    item.code,
    item.name,
    `${item.active}`,
    item.cohort,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRetentionDigestViews(items: GlobalRetentionDigest[]): GlobalRetentionDigestView[] {
  const views: GlobalRetentionDigestView[] = [];
  for (const item of items) {
    views.push(toGlobalRetentionDigestView(item));
  }
  return views;
}

export function sumGlobalRetentionDigestView(view: GlobalRetentionDigestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
