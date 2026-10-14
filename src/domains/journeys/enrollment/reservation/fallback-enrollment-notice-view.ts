import * as text from "../../../../kit/text.js";
import { FallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

/** How screens and exports show a fallback enrollment notice. */
export class FallbackEnrollmentNoticeView {
  code: string;
  title: string;
  ownerId: string;
  quantity: string;
  statusLabel: string;

  constructor(code: string, title: string, ownerId: string, quantity: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackEnrollmentNoticeView(item: FallbackEnrollmentNotice): FallbackEnrollmentNoticeView {
  return new FallbackEnrollmentNoticeView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.ownerId, 64),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackEnrollmentNoticeViews(items: FallbackEnrollmentNotice[]): FallbackEnrollmentNoticeView[] {
  const views: FallbackEnrollmentNoticeView[] = [];
  for (const item of items) {
    views.push(toFallbackEnrollmentNoticeView(item));
  }
  return views;
}

export function sumFallbackEnrollmentNoticeView(view: FallbackEnrollmentNoticeView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
