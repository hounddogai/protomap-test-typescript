import { CappedWaitAdjustment } from "./capped-wait-adjustment.js";

/** How screens and exports show a capped wait adjustment. */
export class CappedWaitAdjustmentView {
  code: string;
  titleText: string;
  description: string;
  graceDays: string;
  attemptsText: string;
  contactEmail: string;
  expiresAt: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    description: string,
    graceDays: string,
    attemptsText: string,
    contactEmail: string,
    expiresAt: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.description = description;
    this.graceDays = graceDays;
    this.attemptsText = attemptsText;
    this.contactEmail = contactEmail;
    this.expiresAt = expiresAt;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toCappedWaitAdjustmentView(item: CappedWaitAdjustment): CappedWaitAdjustmentView {
  return new CappedWaitAdjustmentView(
    item.code,
    item.title,
    item.description,
    String(item.graceDays),
    String(item.attempts),
    item.contactEmail,
    String(item.expiresAt),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedWaitAdjustmentViews(items: CappedWaitAdjustment[]): CappedWaitAdjustmentView[] {
  const views: CappedWaitAdjustmentView[] = [];
  for (const item of items) {
    views.push(toCappedWaitAdjustmentView(item));
  }
  return views;
}

export function sumCappedWaitAdjustmentView(view: CappedWaitAdjustmentView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedGraceDays + parsedAttempts + parsedExpiresAt;
}
