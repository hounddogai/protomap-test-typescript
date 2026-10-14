import { PreferenceException } from "./preference-exception.js";

/** How screens and exports show a preference exception. */
export class PreferenceExceptionView {
  code: string;
  title: string;
  endsAtText: string;
  pinned: string;
  amount: string;
  maximum: string;
  visible: string;
  expiresAt: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAtText: string,
    pinned: string,
    amount: string,
    maximum: string,
    visible: string,
    expiresAt: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAtText = endsAtText;
    this.pinned = pinned;
    this.amount = amount;
    this.maximum = maximum;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceExceptionView(item: PreferenceException): PreferenceExceptionView {
  return new PreferenceExceptionView(
    item.code,
    item.title,
    String(item.endsAt),
    `${item.pinned}`,
    item.amount.toFixed(2),
    item.maximum.toFixed(2),
    `${item.visible}`,
    String(item.expiresAt),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceExceptionViews(items: PreferenceException[]): PreferenceExceptionView[] {
  const views: PreferenceExceptionView[] = [];
  for (const item of items) {
    views.push(toPreferenceExceptionView(item));
  }
  return views;
}

export function sumPreferenceExceptionView(view: PreferenceExceptionView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedEndsAt + parsedAmount + parsedMaximum;
}
