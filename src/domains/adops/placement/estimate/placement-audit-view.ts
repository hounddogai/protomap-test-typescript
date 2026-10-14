import * as text from "../../../../kit/text.js";
import { PlacementAudit } from "./placement-audit.js";

/** How screens and exports show a placement audit. */
export class PlacementAuditView {
  codeText: string;
  name: string;
  segmentText: string;
  ratio: string;
  amount: string;
  impressions: string;
  locale: string;
  weightText: string;
  activeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    segmentText: string,
    ratio: string,
    amount: string,
    impressions: string,
    locale: string,
    weightText: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.segmentText = segmentText;
    this.ratio = ratio;
    this.amount = amount;
    this.impressions = impressions;
    this.locale = locale;
    this.weightText = weightText;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementAuditView(item: PlacementAudit): PlacementAuditView {
  return new PlacementAuditView(
    item.code,
    item.name,
    text.truncate(item.segment, 64),
    item.ratio.toFixed(2),
    item.amount.toFixed(2),
    String(item.impressions),
    item.locale,
    item.weight.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementAuditViews(items: PlacementAudit[]): PlacementAuditView[] {
  const views: PlacementAuditView[] = [];
  for (const item of items) {
    views.push(toPlacementAuditView(item));
  }
  return views;
}

export function sumPlacementAuditView(view: PlacementAuditView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedRatio + parsedAmount + parsedImpressions;
}
