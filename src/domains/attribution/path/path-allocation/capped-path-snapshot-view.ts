import * as text from "../../../../kit/text.js";
import { CappedPathSnapshot } from "./capped-path-snapshot.js";

/** How screens and exports show a capped path snapshot. */
export class CappedPathSnapshotView {
  code: string;
  title: string;
  budget: string;
  region: string;
  locale: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    region: string,
    locale: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.region = region;
    this.locale = locale;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPathSnapshotView(item: CappedPathSnapshot): CappedPathSnapshotView {
  return new CappedPathSnapshotView(
    item.code,
    text.truncate(item.title, 120),
    item.budget.toFixed(2),
    item.region,
    item.locale,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPathSnapshotViews(items: CappedPathSnapshot[]): CappedPathSnapshotView[] {
  const views: CappedPathSnapshotView[] = [];
  for (const item of items) {
    views.push(toCappedPathSnapshotView(item));
  }
  return views;
}

export function sumCappedPathSnapshotView(view: CappedPathSnapshotView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
