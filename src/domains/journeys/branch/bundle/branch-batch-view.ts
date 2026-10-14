import * as text from "../../../../kit/text.js";
import { BranchBatch } from "./branch-batch.js";

/** How screens and exports show a branch batch. */
export class BranchBatchView {
  code: string;
  name: string;
  endsAtText: string;
  priority: string;
  regionText: string;
  startsAtText: string;
  attemptsText: string;
  phone: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    endsAtText: string,
    priority: string,
    regionText: string,
    startsAtText: string,
    attemptsText: string,
    phone: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.endsAtText = endsAtText;
    this.priority = priority;
    this.regionText = regionText;
    this.startsAtText = startsAtText;
    this.attemptsText = attemptsText;
    this.phone = phone;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toBranchBatchView(item: BranchBatch): BranchBatchView {
  return new BranchBatchView(
    item.code,
    text.truncate(item.name, 64),
    String(item.endsAt),
    String(item.priority),
    item.region,
    String(item.startsAt),
    String(item.attempts),
    text.truncate(item.phone, 120),
    text.truncate(item.currency, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchBatchViews(items: BranchBatch[]): BranchBatchView[] {
  const views: BranchBatchView[] = [];
  for (const item of items) {
    views.push(toBranchBatchView(item));
  }
  return views;
}

export function sumBranchBatchView(view: BranchBatchView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedEndsAt + parsedPriority + parsedStartsAt;
}
