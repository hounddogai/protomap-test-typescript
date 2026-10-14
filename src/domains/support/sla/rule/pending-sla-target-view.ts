import { PendingSlaTarget } from "./pending-sla-target.js";

/** How screens and exports show a pending sla target. */
export class PendingSlaTargetView {
  code: string;
  label: string;
  campaignRefText: string;
  endsAtText: string;
  score: string;
  maximumText: string;
  discount: string;
  priority: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRefText: string,
    endsAtText: string,
    score: string,
    maximumText: string,
    discount: string,
    priority: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRefText = campaignRefText;
    this.endsAtText = endsAtText;
    this.score = score;
    this.maximumText = maximumText;
    this.discount = discount;
    this.priority = priority;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSlaTargetView(item: PendingSlaTarget): PendingSlaTargetView {
  return new PendingSlaTargetView(
    item.code,
    item.label,
    item.campaignRef,
    String(item.endsAt),
    item.score.toFixed(2),
    item.maximum.toFixed(2),
    item.discount.toFixed(2),
    String(item.priority),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSlaTargetViews(items: PendingSlaTarget[]): PendingSlaTargetView[] {
  const views: PendingSlaTargetView[] = [];
  for (const item of items) {
    views.push(toPendingSlaTargetView(item));
  }
  return views;
}

export function sumPendingSlaTargetView(view: PendingSlaTargetView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedEndsAt + parsedScore + parsedMaximum;
}
