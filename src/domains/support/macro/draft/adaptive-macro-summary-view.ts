import * as text from "../../../../kit/text.js";
import { AdaptiveMacroSummary } from "./adaptive-macro-summary.js";

/** How screens and exports show a adaptive macro summary. */
export class AdaptiveMacroSummaryView {
  code: string;
  label: string;
  cost: string;
  segmentText: string;
  variantText: string;
  description: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    segmentText: string,
    variantText: string,
    description: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.segmentText = segmentText;
    this.variantText = variantText;
    this.description = description;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveMacroSummaryView(item: AdaptiveMacroSummary): AdaptiveMacroSummaryView {
  return new AdaptiveMacroSummaryView(
    item.code,
    text.truncate(item.label, 80),
    item.cost.toFixed(2),
    item.segment,
    item.variant,
    item.description,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveMacroSummaryViews(items: AdaptiveMacroSummary[]): AdaptiveMacroSummaryView[] {
  const views: AdaptiveMacroSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveMacroSummaryView(item));
  }
  return views;
}

export function sumAdaptiveMacroSummaryView(view: AdaptiveMacroSummaryView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
