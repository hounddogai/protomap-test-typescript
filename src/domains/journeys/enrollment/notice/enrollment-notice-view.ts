import * as text from "../../../../kit/text.js";
import { EnrollmentNotice } from "./enrollment-notice.js";

/** How screens and exports show a enrollment notice. */
export class EnrollmentNoticeView {
  code: string;
  name: string;
  priorityText: string;
  margin: string;
  locale: string;
  variant: string;
  source: string;
  visible: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priorityText: string,
    margin: string,
    locale: string,
    variant: string,
    source: string,
    visible: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priorityText = priorityText;
    this.margin = margin;
    this.locale = locale;
    this.variant = variant;
    this.source = source;
    this.visible = visible;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentNoticeView(item: EnrollmentNotice): EnrollmentNoticeView {
  return new EnrollmentNoticeView(
    item.code,
    item.name,
    String(item.priority),
    item.margin.toFixed(2),
    text.truncate(item.locale, 40),
    text.truncate(item.variant, 64),
    text.truncate(item.source, 64),
    `${item.visible}`,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentNoticeViews(items: EnrollmentNotice[]): EnrollmentNoticeView[] {
  const views: EnrollmentNoticeView[] = [];
  for (const item of items) {
    views.push(toEnrollmentNoticeView(item));
  }
  return views;
}

export function sumEnrollmentNoticeView(view: EnrollmentNoticeView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedPriority + parsedMargin + parsedQuantity;
}
