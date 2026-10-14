import * as text from "../../../../kit/text.js";
import { AdaptivePacingBaseline } from "./adaptive-pacing-baseline.js";

/** How screens and exports show a adaptive pacing baseline. */
export class AdaptivePacingBaselineView {
  code: string;
  title: string;
  notes: string;
  costText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    notes: string,
    costText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.costText = costText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePacingBaselineView(item: AdaptivePacingBaseline): AdaptivePacingBaselineView {
  return new AdaptivePacingBaselineView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 64),
    item.notes,
    item.cost.toFixed(2),
    text.truncate(item.audienceId, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePacingBaselineViews(items: AdaptivePacingBaseline[]): AdaptivePacingBaselineView[] {
  const views: AdaptivePacingBaselineView[] = [];
  for (const item of items) {
    views.push(toAdaptivePacingBaselineView(item));
  }
  return views;
}

export function sumAdaptivePacingBaselineView(view: AdaptivePacingBaselineView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedCost;
}
