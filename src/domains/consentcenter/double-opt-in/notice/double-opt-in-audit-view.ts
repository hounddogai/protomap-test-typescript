import * as text from "../../../../kit/text.js";
import { DoubleOptInAudit } from "./double-opt-in-audit.js";

/** How screens and exports show a double opt in audit. */
export class DoubleOptInAuditView {
  codeText: string;
  label: string;
  reviewerText: string;
  openRateText: string;
  visible: string;
  regionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    reviewerText: string,
    openRateText: string,
    visible: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.reviewerText = reviewerText;
    this.openRateText = openRateText;
    this.visible = visible;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInAuditView(item: DoubleOptInAudit): DoubleOptInAuditView {
  return new DoubleOptInAuditView(
    item.code,
    text.truncate(item.label, 40),
    item.reviewer,
    item.openRate.toFixed(2),
    `${item.visible}`,
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInAuditViews(items: DoubleOptInAudit[]): DoubleOptInAuditView[] {
  const views: DoubleOptInAuditView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInAuditView(item));
  }
  return views;
}

export function sumDoubleOptInAuditView(view: DoubleOptInAuditView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedOpenRate;
}
