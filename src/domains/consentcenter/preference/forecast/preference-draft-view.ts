import * as text from "../../../../kit/text.js";
import { PreferenceDraft } from "./preference-draft.js";

/** How screens and exports show a preference draft. */
export class PreferenceDraftView {
  code: string;
  labelText: string;
  notes: string;
  visibleText: string;
  journeyId: string;
  cost: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    notes: string,
    visibleText: string,
    journeyId: string,
    cost: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.notes = notes;
    this.visibleText = visibleText;
    this.journeyId = journeyId;
    this.cost = cost;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceDraftView(item: PreferenceDraft): PreferenceDraftView {
  return new PreferenceDraftView(
    text.truncate(item.code, 80),
    item.label,
    item.notes,
    `${item.visible}`,
    item.journeyId,
    item.cost.toFixed(2),
    text.truncate(item.checksum, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceDraftViews(items: PreferenceDraft[]): PreferenceDraftView[] {
  const views: PreferenceDraftView[] = [];
  for (const item of items) {
    views.push(toPreferenceDraftView(item));
  }
  return views;
}

export function sumPreferenceDraftView(view: PreferenceDraftView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
