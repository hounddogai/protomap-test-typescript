import * as text from "../../../../kit/text.js";
import { RegionalEscalationEstimate } from "./regional-escalation-estimate.js";

/** How screens and exports show a regional escalation estimate. */
export class RegionalEscalationEstimateView {
  code: string;
  name: string;
  threshold: string;
  regionText: string;
  externalRefText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    threshold: string,
    regionText: string,
    externalRefText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.regionText = regionText;
    this.externalRefText = externalRefText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalEscalationEstimateView(item: RegionalEscalationEstimate): RegionalEscalationEstimateView {
  return new RegionalEscalationEstimateView(
    item.code,
    text.truncate(item.name, 120),
    item.threshold.toFixed(2),
    text.truncate(item.region, 80),
    item.externalRef,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalEscalationEstimateViews(items: RegionalEscalationEstimate[]): RegionalEscalationEstimateView[] {
  const views: RegionalEscalationEstimateView[] = [];
  for (const item of items) {
    views.push(toRegionalEscalationEstimateView(item));
  }
  return views;
}

export function sumRegionalEscalationEstimateView(view: RegionalEscalationEstimateView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedThreshold + parsedSendAt;
}
