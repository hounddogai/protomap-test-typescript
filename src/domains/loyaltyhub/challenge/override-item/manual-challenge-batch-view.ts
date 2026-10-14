import * as text from "../../../../kit/text.js";
import { ManualChallengeBatch } from "./manual-challenge-batch.js";

/** How screens and exports show a manual challenge batch. */
export class ManualChallengeBatchView {
  code: string;
  title: string;
  attemptsText: string;
  capacityText: string;
  marginText: string;
  amount: string;
  graceDays: string;
  updatedAt: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attemptsText: string,
    capacityText: string,
    marginText: string,
    amount: string,
    graceDays: string,
    updatedAt: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attemptsText = attemptsText;
    this.capacityText = capacityText;
    this.marginText = marginText;
    this.amount = amount;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toManualChallengeBatchView(item: ManualChallengeBatch): ManualChallengeBatchView {
  return new ManualChallengeBatchView(
    item.code,
    text.truncate(item.title, 64),
    String(item.attempts),
    String(item.capacity),
    item.margin.toFixed(2),
    item.amount.toFixed(2),
    String(item.graceDays),
    String(item.updatedAt),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualChallengeBatchViews(items: ManualChallengeBatch[]): ManualChallengeBatchView[] {
  const views: ManualChallengeBatchView[] = [];
  for (const item of items) {
    views.push(toManualChallengeBatchView(item));
  }
  return views;
}

export function sumManualChallengeBatchView(view: ManualChallengeBatchView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedAttempts + parsedCapacity + parsedMargin;
}
