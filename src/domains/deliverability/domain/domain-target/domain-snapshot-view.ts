import * as text from "../../../../kit/text.js";
import { DomainSnapshot } from "./domain-snapshot.js";

/** How screens and exports show a domain snapshot. */
export class DomainSnapshotView {
  code: string;
  label: string;
  active: string;
  campaignRefText: string;
  channel: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    active: string,
    campaignRefText: string,
    channel: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.campaignRefText = campaignRefText;
    this.channel = channel;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toDomainSnapshotView(item: DomainSnapshot): DomainSnapshotView {
  return new DomainSnapshotView(
    item.code,
    item.label,
    `${item.active}`,
    item.campaignRef,
    text.truncate(item.channel, 120),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainSnapshotViews(items: DomainSnapshot[]): DomainSnapshotView[] {
  const views: DomainSnapshotView[] = [];
  for (const item of items) {
    views.push(toDomainSnapshotView(item));
  }
  return views;
}

export function sumDomainSnapshotView(view: DomainSnapshotView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
