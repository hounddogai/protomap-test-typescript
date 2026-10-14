import * as text from "../../../../kit/text.js";
import { DefaultPostAssignment } from "./default-post-assignment.js";

/** How screens and exports show a default post assignment. */
export class DefaultPostAssignmentView {
  code: string;
  name: string;
  rate: string;
  margin: string;
  pinned: string;
  currencyText: string;
  updatedAtText: string;
  label: string;
  variant: string;
  maximum: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    margin: string,
    pinned: string,
    currencyText: string,
    updatedAtText: string,
    label: string,
    variant: string,
    maximum: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.margin = margin;
    this.pinned = pinned;
    this.currencyText = currencyText;
    this.updatedAtText = updatedAtText;
    this.label = label;
    this.variant = variant;
    this.maximum = maximum;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPostAssignmentView(item: DefaultPostAssignment): DefaultPostAssignmentView {
  return new DefaultPostAssignmentView(
    text.truncate(item.code, 40),
    item.name,
    item.rate.toFixed(2),
    item.margin.toFixed(2),
    `${item.pinned}`,
    item.currency,
    String(item.updatedAt),
    text.truncate(item.label, 120),
    text.truncate(item.variant, 64),
    item.maximum.toFixed(2),
    text.truncate(item.locale, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPostAssignmentViews(items: DefaultPostAssignment[]): DefaultPostAssignmentView[] {
  const views: DefaultPostAssignmentView[] = [];
  for (const item of items) {
    views.push(toDefaultPostAssignmentView(item));
  }
  return views;
}

export function sumDefaultPostAssignmentView(view: DefaultPostAssignmentView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedRate + parsedMargin + parsedUpdatedAt;
}
