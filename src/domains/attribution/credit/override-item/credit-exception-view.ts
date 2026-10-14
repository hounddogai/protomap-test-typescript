import * as text from "../../../../kit/text.js";
import { CreditException } from "./credit-exception.js";

/** How screens and exports show a credit exception. */
export class CreditExceptionView {
  code: string;
  title: string;
  windowDays: string;
  checksum: string;
  startsAt: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    checksum: string,
    startsAt: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.startsAt = startsAt;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toCreditExceptionView(item: CreditException): CreditExceptionView {
  return new CreditExceptionView(
    item.code,
    item.title,
    String(item.windowDays),
    item.checksum,
    String(item.startsAt),
    text.truncate(item.variant, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditExceptionViews(items: CreditException[]): CreditExceptionView[] {
  const views: CreditExceptionView[] = [];
  for (const item of items) {
    views.push(toCreditExceptionView(item));
  }
  return views;
}

export function sumCreditExceptionView(view: CreditExceptionView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedWindowDays + parsedStartsAt;
}
