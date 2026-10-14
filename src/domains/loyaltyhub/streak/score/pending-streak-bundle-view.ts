import { PendingStreakBundle } from "./pending-streak-bundle.js";

/** How screens and exports show a pending streak bundle. */
export class PendingStreakBundleView {
  codeText: string;
  labelText: string;
  capacity: string;
  maximum: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    capacity: string,
    maximum: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.capacity = capacity;
    this.maximum = maximum;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toPendingStreakBundleView(item: PendingStreakBundle): PendingStreakBundleView {
  return new PendingStreakBundleView(
    item.code,
    item.label,
    String(item.capacity),
    item.maximum.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingStreakBundleViews(items: PendingStreakBundle[]): PendingStreakBundleView[] {
  const views: PendingStreakBundleView[] = [];
  for (const item of items) {
    views.push(toPendingStreakBundleView(item));
  }
  return views;
}

export function sumPendingStreakBundleView(view: PendingStreakBundleView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedCapacity + parsedMaximum;
}
