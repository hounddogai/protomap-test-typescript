import * as text from "../../../../kit/text.js";
import { RegionalPacingSlot } from "./regional-pacing-slot.js";

/** How screens and exports show a regional pacing slot. */
export class RegionalPacingSlotView {
  codeText: string;
  labelText: string;
  cost: string;
  impressions: string;
  title: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    cost: string,
    impressions: string,
    title: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.cost = cost;
    this.impressions = impressions;
    this.title = title;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPacingSlotView(item: RegionalPacingSlot): RegionalPacingSlotView {
  return new RegionalPacingSlotView(
    item.code,
    text.truncate(item.label, 64),
    item.cost.toFixed(2),
    String(item.impressions),
    item.title,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPacingSlotViews(items: RegionalPacingSlot[]): RegionalPacingSlotView[] {
  const views: RegionalPacingSlotView[] = [];
  for (const item of items) {
    views.push(toRegionalPacingSlotView(item));
  }
  return views;
}

export function sumRegionalPacingSlotView(view: RegionalPacingSlotView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedCost + parsedImpressions + parsedMargin;
}
