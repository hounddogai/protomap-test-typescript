import * as text from "../../../../kit/text.js";
import { CsatSnapshot } from "./csat-snapshot.js";

/** How screens and exports show a csat snapshot. */
export class CsatSnapshotView {
  code: string;
  label: string;
  name: string;
  title: string;
  approved: string;
  expiresAt: string;
  cohortText: string;
  budgetText: string;
  priority: string;
  channel: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    name: string,
    title: string,
    approved: string,
    expiresAt: string,
    cohortText: string,
    budgetText: string,
    priority: string,
    channel: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.title = title;
    this.approved = approved;
    this.expiresAt = expiresAt;
    this.cohortText = cohortText;
    this.budgetText = budgetText;
    this.priority = priority;
    this.channel = channel;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toCsatSnapshotView(item: CsatSnapshot): CsatSnapshotView {
  return new CsatSnapshotView(
    item.code,
    item.label,
    item.name,
    item.title,
    `${item.approved}`,
    String(item.expiresAt),
    item.cohort,
    item.budget.toFixed(2),
    String(item.priority),
    text.truncate(item.channel, 40),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatSnapshotViews(items: CsatSnapshot[]): CsatSnapshotView[] {
  const views: CsatSnapshotView[] = [];
  for (const item of items) {
    views.push(toCsatSnapshotView(item));
  }
  return views;
}

export function sumCsatSnapshotView(view: CsatSnapshotView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedExpiresAt + parsedBudget + parsedPriority;
}
