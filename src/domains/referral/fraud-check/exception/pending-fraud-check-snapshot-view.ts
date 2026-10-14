import { PendingFraudCheckSnapshot } from "./pending-fraud-check-snapshot.js";

/** How screens and exports show a pending fraud check snapshot. */
export class PendingFraudCheckSnapshotView {
  code: string;
  label: string;
  discountText: string;
  cohort: string;
  country: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    discountText: string,
    cohort: string,
    country: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.discountText = discountText;
    this.cohort = cohort;
    this.country = country;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFraudCheckSnapshotView(item: PendingFraudCheckSnapshot): PendingFraudCheckSnapshotView {
  return new PendingFraudCheckSnapshotView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    item.cohort,
    item.country,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFraudCheckSnapshotViews(items: PendingFraudCheckSnapshot[]): PendingFraudCheckSnapshotView[] {
  const views: PendingFraudCheckSnapshotView[] = [];
  for (const item of items) {
    views.push(toPendingFraudCheckSnapshotView(item));
  }
  return views;
}

export function sumPendingFraudCheckSnapshotView(view: PendingFraudCheckSnapshotView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedDiscount + parsedPriority;
}
