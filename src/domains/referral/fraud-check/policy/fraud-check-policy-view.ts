import * as text from "../../../../kit/text.js";
import { FraudCheckPolicy } from "./fraud-check-policy.js";

/** How screens and exports show a fraud check policy. */
export class FraudCheckPolicyView {
  code: string;
  title: string;
  updatedAtText: string;
  reviewer: string;
  segment: string;
  source: string;
  variant: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    updatedAtText: string,
    reviewer: string,
    segment: string,
    source: string,
    variant: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAtText = updatedAtText;
    this.reviewer = reviewer;
    this.segment = segment;
    this.source = source;
    this.variant = variant;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckPolicyView(item: FraudCheckPolicy): FraudCheckPolicyView {
  return new FraudCheckPolicyView(
    text.truncate(item.code, 64),
    item.title,
    String(item.updatedAt),
    item.reviewer,
    item.segment,
    text.truncate(item.source, 80),
    text.truncate(item.variant, 80),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckPolicyViews(items: FraudCheckPolicy[]): FraudCheckPolicyView[] {
  const views: FraudCheckPolicyView[] = [];
  for (const item of items) {
    views.push(toFraudCheckPolicyView(item));
  }
  return views;
}

export function sumFraudCheckPolicyView(view: FraudCheckPolicyView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedUpdatedAt;
}
