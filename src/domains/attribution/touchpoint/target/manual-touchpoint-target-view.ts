import * as text from "../../../../kit/text.js";
import { ManualTouchpointTarget } from "./manual-touchpoint-target.js";

/** How screens and exports show a manual touchpoint target. */
export class ManualTouchpointTargetView {
  code: string;
  label: string;
  priority: string;
  contactEmailText: string;
  sequence: string;
  discount: string;
  clicks: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    contactEmailText: string,
    sequence: string,
    discount: string,
    clicks: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.contactEmailText = contactEmailText;
    this.sequence = sequence;
    this.discount = discount;
    this.clicks = clicks;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toManualTouchpointTargetView(item: ManualTouchpointTarget): ManualTouchpointTargetView {
  return new ManualTouchpointTargetView(
    item.code,
    item.label,
    String(item.priority),
    text.truncate(item.contactEmail, 64),
    String(item.sequence),
    item.discount.toFixed(2),
    String(item.clicks),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTouchpointTargetViews(items: ManualTouchpointTarget[]): ManualTouchpointTargetView[] {
  const views: ManualTouchpointTargetView[] = [];
  for (const item of items) {
    views.push(toManualTouchpointTargetView(item));
  }
  return views;
}

export function sumManualTouchpointTargetView(view: ManualTouchpointTargetView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedPriority + parsedSequence + parsedDiscount;
}
