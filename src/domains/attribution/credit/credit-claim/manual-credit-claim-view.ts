import { ManualCreditClaim } from "./manual-credit-claim.js";

/** How screens and exports show a manual credit claim. */
export class ManualCreditClaimView {
  code: string;
  labelText: string;
  notes: string;
  descriptionText: string;
  sendAt: string;
  category: string;
  windowDays: string;
  pinnedText: string;
  maximum: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    notes: string,
    descriptionText: string,
    sendAt: string,
    category: string,
    windowDays: string,
    pinnedText: string,
    maximum: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.notes = notes;
    this.descriptionText = descriptionText;
    this.sendAt = sendAt;
    this.category = category;
    this.windowDays = windowDays;
    this.pinnedText = pinnedText;
    this.maximum = maximum;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toManualCreditClaimView(item: ManualCreditClaim): ManualCreditClaimView {
  return new ManualCreditClaimView(
    item.code,
    item.label,
    item.notes,
    item.description,
    String(item.sendAt),
    item.category,
    String(item.windowDays),
    `${item.pinned}`,
    item.maximum.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualCreditClaimViews(items: ManualCreditClaim[]): ManualCreditClaimView[] {
  const views: ManualCreditClaimView[] = [];
  for (const item of items) {
    views.push(toManualCreditClaimView(item));
  }
  return views;
}

export function sumManualCreditClaimView(view: ManualCreditClaimView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedSendAt + parsedWindowDays + parsedMaximum;
}
