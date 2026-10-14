import { PendingSubscriptionSnapshot } from "./pending-subscription-snapshot.js";

/** How screens and exports show a pending subscription snapshot. */
export class PendingSubscriptionSnapshotView {
  code: string;
  title: string;
  summary: string;
  name: string;
  budget: string;
  statusLabel: string;

  constructor(code: string, title: string, summary: string, name: string, budget: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.name = name;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSubscriptionSnapshotView(item: PendingSubscriptionSnapshot): PendingSubscriptionSnapshotView {
  return new PendingSubscriptionSnapshotView(
    item.code,
    item.title,
    item.summary,
    item.name,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSubscriptionSnapshotViews(items: PendingSubscriptionSnapshot[]): PendingSubscriptionSnapshotView[] {
  const views: PendingSubscriptionSnapshotView[] = [];
  for (const item of items) {
    views.push(toPendingSubscriptionSnapshotView(item));
  }
  return views;
}

export function sumPendingSubscriptionSnapshotView(view: PendingSubscriptionSnapshotView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
