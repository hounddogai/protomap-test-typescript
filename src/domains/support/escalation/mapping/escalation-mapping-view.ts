import * as text from "../../../../kit/text.js";
import { EscalationMapping } from "./escalation-mapping.js";

/** How screens and exports show a escalation mapping. */
export class EscalationMappingView {
  code: string;
  titleText: string;
  costText: string;
  impressionsText: string;
  notes: string;
  marginText: string;
  expiresAt: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    costText: string,
    impressionsText: string,
    notes: string,
    marginText: string,
    expiresAt: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.costText = costText;
    this.impressionsText = impressionsText;
    this.notes = notes;
    this.marginText = marginText;
    this.expiresAt = expiresAt;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationMappingView(item: EscalationMapping): EscalationMappingView {
  return new EscalationMappingView(
    item.code,
    text.truncate(item.title, 64),
    item.cost.toFixed(2),
    String(item.impressions),
    item.notes,
    item.margin.toFixed(2),
    String(item.expiresAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationMappingViews(items: EscalationMapping[]): EscalationMappingView[] {
  const views: EscalationMappingView[] = [];
  for (const item of items) {
    views.push(toEscalationMappingView(item));
  }
  return views;
}

export function sumEscalationMappingView(view: EscalationMappingView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedCost + parsedImpressions + parsedMargin;
}
