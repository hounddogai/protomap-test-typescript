import * as text from "../../../../kit/text.js";
import { PendingOptOutBaseline } from "./pending-opt-out-baseline.js";

/** How screens and exports show a pending opt out baseline. */
export class PendingOptOutBaselineView {
  code: string;
  name: string;
  margin: string;
  attempts: string;
  phone: string;
  categoryText: string;
  active: string;
  description: string;
  utmSource: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    attempts: string,
    phone: string,
    categoryText: string,
    active: string,
    description: string,
    utmSource: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.attempts = attempts;
    this.phone = phone;
    this.categoryText = categoryText;
    this.active = active;
    this.description = description;
    this.utmSource = utmSource;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPendingOptOutBaselineView(item: PendingOptOutBaseline): PendingOptOutBaselineView {
  return new PendingOptOutBaselineView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    item.margin.toFixed(2),
    String(item.attempts),
    item.phone,
    item.category,
    `${item.active}`,
    item.description,
    text.truncate(item.utmSource, 120),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingOptOutBaselineViews(items: PendingOptOutBaseline[]): PendingOptOutBaselineView[] {
  const views: PendingOptOutBaselineView[] = [];
  for (const item of items) {
    views.push(toPendingOptOutBaselineView(item));
  }
  return views;
}

export function sumPendingOptOutBaselineView(view: PendingOptOutBaselineView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedMargin + parsedAttempts;
}
