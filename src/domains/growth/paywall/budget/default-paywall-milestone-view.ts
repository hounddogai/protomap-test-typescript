import * as text from "../../../../kit/text.js";
import { DefaultPaywallMilestone } from "./default-paywall-milestone.js";

/** How screens and exports show a default paywall milestone. */
export class DefaultPaywallMilestoneView {
  code: string;
  name: string;
  quantityText: string;
  clicks: string;
  label: string;
  reviewerText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantityText: string,
    clicks: string,
    label: string,
    reviewerText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantityText = quantityText;
    this.clicks = clicks;
    this.label = label;
    this.reviewerText = reviewerText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPaywallMilestoneView(item: DefaultPaywallMilestone): DefaultPaywallMilestoneView {
  return new DefaultPaywallMilestoneView(
    item.code,
    text.truncate(item.name, 120),
    String(item.quantity),
    String(item.clicks),
    item.label,
    item.reviewer,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPaywallMilestoneViews(items: DefaultPaywallMilestone[]): DefaultPaywallMilestoneView[] {
  const views: DefaultPaywallMilestoneView[] = [];
  for (const item of items) {
    views.push(toDefaultPaywallMilestoneView(item));
  }
  return views;
}

export function sumDefaultPaywallMilestoneView(view: DefaultPaywallMilestoneView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedQuantity + parsedClicks;
}
