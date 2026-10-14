import * as text from "../../../../kit/text.js";
import { EnrollmentBundle } from "./enrollment-bundle.js";

/** How screens and exports show a enrollment bundle. */
export class EnrollmentBundleView {
  codeText: string;
  title: string;
  sourceText: string;
  quantity: string;
  startsAt: string;
  retries: string;
  budget: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sourceText: string,
    quantity: string,
    startsAt: string,
    retries: string,
    budget: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sourceText = sourceText;
    this.quantity = quantity;
    this.startsAt = startsAt;
    this.retries = retries;
    this.budget = budget;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentBundleView(item: EnrollmentBundle): EnrollmentBundleView {
  return new EnrollmentBundleView(
    item.code,
    item.title,
    item.source,
    String(item.quantity),
    String(item.startsAt),
    String(item.retries),
    item.budget.toFixed(2),
    text.truncate(item.category, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentBundleViews(items: EnrollmentBundle[]): EnrollmentBundleView[] {
  const views: EnrollmentBundleView[] = [];
  for (const item of items) {
    views.push(toEnrollmentBundleView(item));
  }
  return views;
}

export function sumEnrollmentBundleView(view: EnrollmentBundleView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedQuantity + parsedStartsAt + parsedRetries;
}
