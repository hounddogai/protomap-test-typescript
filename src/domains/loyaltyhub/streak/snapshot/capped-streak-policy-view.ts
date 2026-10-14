import * as text from "../../../../kit/text.js";
import { CappedStreakPolicy } from "./capped-streak-policy.js";

/** How screens and exports show a capped streak policy. */
export class CappedStreakPolicyView {
  code: string;
  label: string;
  visible: string;
  updatedAt: string;
  maximumText: string;
  minimum: string;
  pinnedText: string;
  amount: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    updatedAt: string,
    maximumText: string,
    minimum: string,
    pinnedText: string,
    amount: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.maximumText = maximumText;
    this.minimum = minimum;
    this.pinnedText = pinnedText;
    this.amount = amount;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedStreakPolicyView(item: CappedStreakPolicy): CappedStreakPolicyView {
  return new CappedStreakPolicyView(
    item.code,
    item.label,
    `${item.visible}`,
    String(item.updatedAt),
    item.maximum.toFixed(2),
    item.minimum.toFixed(2),
    `${item.pinned}`,
    item.amount.toFixed(2),
    text.truncate(item.contactEmail, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedStreakPolicyViews(items: CappedStreakPolicy[]): CappedStreakPolicyView[] {
  const views: CappedStreakPolicyView[] = [];
  for (const item of items) {
    views.push(toCappedStreakPolicyView(item));
  }
  return views;
}

export function sumCappedStreakPolicyView(view: CappedStreakPolicyView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedUpdatedAt + parsedMaximum + parsedMinimum;
}
