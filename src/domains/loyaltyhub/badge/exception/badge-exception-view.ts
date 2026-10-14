import * as text from "../../../../kit/text.js";
import { BadgeException } from "./badge-exception.js";

/** How screens and exports show a badge exception. */
export class BadgeExceptionView {
  code: string;
  title: string;
  windowDays: string;
  priority: string;
  summary: string;
  sequence: string;
  frequencyCap: string;
  reviewer: string;
  phone: string;
  discountText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    priority: string,
    summary: string,
    sequence: string,
    frequencyCap: string,
    reviewer: string,
    phone: string,
    discountText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.priority = priority;
    this.summary = summary;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.phone = phone;
    this.discountText = discountText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeExceptionView(item: BadgeException): BadgeExceptionView {
  return new BadgeExceptionView(
    text.truncate(item.code, 40),
    item.title,
    String(item.windowDays),
    String(item.priority),
    item.summary,
    String(item.sequence),
    String(item.frequencyCap),
    text.truncate(item.reviewer, 80),
    item.phone,
    item.discount.toFixed(2),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeExceptionViews(items: BadgeException[]): BadgeExceptionView[] {
  const views: BadgeExceptionView[] = [];
  for (const item of items) {
    views.push(toBadgeExceptionView(item));
  }
  return views;
}

export function sumBadgeExceptionView(view: BadgeExceptionView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedWindowDays + parsedPriority + parsedSequence;
}
