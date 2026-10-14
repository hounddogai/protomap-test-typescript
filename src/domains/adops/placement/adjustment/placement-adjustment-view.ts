import * as text from "../../../../kit/text.js";
import { PlacementAdjustment } from "./placement-adjustment.js";

/** How screens and exports show a placement adjustment. */
export class PlacementAdjustmentView {
  code: string;
  label: string;
  maximum: string;
  attempts: string;
  rateText: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    maximum: string,
    attempts: string,
    rateText: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.attempts = attempts;
    this.rateText = rateText;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementAdjustmentView(item: PlacementAdjustment): PlacementAdjustmentView {
  return new PlacementAdjustmentView(
    item.code,
    text.truncate(item.label, 120),
    item.maximum.toFixed(2),
    String(item.attempts),
    item.rate.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementAdjustmentViews(items: PlacementAdjustment[]): PlacementAdjustmentView[] {
  const views: PlacementAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPlacementAdjustmentView(item));
  }
  return views;
}

export function sumPlacementAdjustmentView(view: PlacementAdjustmentView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedMaximum + parsedAttempts + parsedRate;
}
