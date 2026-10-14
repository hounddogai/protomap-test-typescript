import * as text from "../../../../kit/text.js";
import { PrimaryEnrollmentDigest } from "./primary-enrollment-digest.js";

/** How screens and exports show a primary enrollment digest. */
export class PrimaryEnrollmentDigestView {
  code: string;
  label: string;
  quantity: string;
  minimum: string;
  budget: string;
  checksum: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantity: string,
    minimum: string,
    budget: string,
    checksum: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.minimum = minimum;
    this.budget = budget;
    this.checksum = checksum;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryEnrollmentDigestView(item: PrimaryEnrollmentDigest): PrimaryEnrollmentDigestView {
  return new PrimaryEnrollmentDigestView(
    item.code,
    text.truncate(item.label, 120),
    String(item.quantity),
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    text.truncate(item.checksum, 120),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryEnrollmentDigestViews(items: PrimaryEnrollmentDigest[]): PrimaryEnrollmentDigestView[] {
  const views: PrimaryEnrollmentDigestView[] = [];
  for (const item of items) {
    views.push(toPrimaryEnrollmentDigestView(item));
  }
  return views;
}

export function sumPrimaryEnrollmentDigestView(view: PrimaryEnrollmentDigestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedQuantity + parsedMinimum + parsedBudget;
}
