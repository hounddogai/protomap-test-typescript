import * as text from "../../../../kit/text.js";
import { AdaptivePaywallThreshold } from "./adaptive-paywall-threshold.js";

/** How screens and exports show a adaptive paywall threshold. */
export class AdaptivePaywallThresholdView {
  code: string;
  nameText: string;
  contactEmail: string;
  priority: string;
  variantText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    contactEmail: string,
    priority: string,
    variantText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.variantText = variantText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePaywallThresholdView(item: AdaptivePaywallThreshold): AdaptivePaywallThresholdView {
  return new AdaptivePaywallThresholdView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    item.contactEmail,
    String(item.priority),
    text.truncate(item.variant, 64),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePaywallThresholdViews(items: AdaptivePaywallThreshold[]): AdaptivePaywallThresholdView[] {
  const views: AdaptivePaywallThresholdView[] = [];
  for (const item of items) {
    views.push(toAdaptivePaywallThresholdView(item));
  }
  return views;
}

export function sumAdaptivePaywallThresholdView(view: AdaptivePaywallThresholdView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedPriority + parsedSequence;
}
