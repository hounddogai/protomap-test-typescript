import * as text from "../../../../kit/text.js";
import { PrimaryPaywallBaseline } from "./primary-paywall-baseline.js";

/** How screens and exports show a primary paywall baseline. */
export class PrimaryPaywallBaselineView {
  codeText: string;
  title: string;
  contactEmailText: string;
  priority: string;
  capacity: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    contactEmailText: string,
    priority: string,
    capacity: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.contactEmailText = contactEmailText;
    this.priority = priority;
    this.capacity = capacity;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPaywallBaselineView(item: PrimaryPaywallBaseline): PrimaryPaywallBaselineView {
  return new PrimaryPaywallBaselineView(
    item.code,
    text.truncate(item.title, 80),
    item.contactEmail,
    String(item.priority),
    String(item.capacity),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPaywallBaselineViews(items: PrimaryPaywallBaseline[]): PrimaryPaywallBaselineView[] {
  const views: PrimaryPaywallBaselineView[] = [];
  for (const item of items) {
    views.push(toPrimaryPaywallBaselineView(item));
  }
  return views;
}

export function sumPrimaryPaywallBaselineView(view: PrimaryPaywallBaselineView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedPriority + parsedCapacity + parsedThreshold;
}
