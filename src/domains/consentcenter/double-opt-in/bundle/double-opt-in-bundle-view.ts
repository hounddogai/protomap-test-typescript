import * as text from "../../../../kit/text.js";
import { DoubleOptInBundle } from "./double-opt-in-bundle.js";

/** How screens and exports show a double opt in bundle. */
export class DoubleOptInBundleView {
  codeText: string;
  name: string;
  sendAt: string;
  externalRefText: string;
  budget: string;
  country: string;
  reviewerText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    sendAt: string,
    externalRefText: string,
    budget: string,
    country: string,
    reviewerText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.sendAt = sendAt;
    this.externalRefText = externalRefText;
    this.budget = budget;
    this.country = country;
    this.reviewerText = reviewerText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInBundleView(item: DoubleOptInBundle): DoubleOptInBundleView {
  return new DoubleOptInBundleView(
    item.code,
    text.truncate(item.name, 40),
    String(item.sendAt),
    item.externalRef,
    item.budget.toFixed(2),
    item.country,
    item.reviewer,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInBundleViews(items: DoubleOptInBundle[]): DoubleOptInBundleView[] {
  const views: DoubleOptInBundleView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInBundleView(item));
  }
  return views;
}

export function sumDoubleOptInBundleView(view: DoubleOptInBundleView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedSendAt + parsedBudget + parsedCreatedAt;
}
