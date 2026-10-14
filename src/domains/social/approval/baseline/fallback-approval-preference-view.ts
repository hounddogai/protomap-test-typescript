import * as text from "../../../../kit/text.js";
import { FallbackApprovalPreference } from "./fallback-approval-preference.js";

/** How screens and exports show a fallback approval preference. */
export class FallbackApprovalPreferenceView {
  code: string;
  label: string;
  expiresAt: string;
  priority: string;
  campaignRef: string;
  segment: string;
  approved: string;
  unit: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    expiresAt: string,
    priority: string,
    campaignRef: string,
    segment: string,
    approved: string,
    unit: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.approved = approved;
    this.unit = unit;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackApprovalPreferenceView(item: FallbackApprovalPreference): FallbackApprovalPreferenceView {
  return new FallbackApprovalPreferenceView(
    item.code,
    text.truncate(item.label, 80),
    String(item.expiresAt),
    String(item.priority),
    item.campaignRef,
    item.segment,
    `${item.approved}`,
    item.unit,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackApprovalPreferenceViews(items: FallbackApprovalPreference[]): FallbackApprovalPreferenceView[] {
  const views: FallbackApprovalPreferenceView[] = [];
  for (const item of items) {
    views.push(toFallbackApprovalPreferenceView(item));
  }
  return views;
}

export function sumFallbackApprovalPreferenceView(view: FallbackApprovalPreferenceView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedExpiresAt + parsedPriority + parsedDiscount;
}
