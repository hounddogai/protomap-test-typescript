import * as text from "../../../../kit/text.js";
import { SeasonalStepDraft } from "./seasonal-step-draft.js";

/** How screens and exports show a seasonal step draft. */
export class SeasonalStepDraftView {
  code: string;
  nameText: string;
  journeyIdText: string;
  bid: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    journeyIdText: string,
    bid: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.journeyIdText = journeyIdText;
    this.bid = bid;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalStepDraftView(item: SeasonalStepDraft): SeasonalStepDraftView {
  return new SeasonalStepDraftView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    item.journeyId,
    item.bid.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalStepDraftViews(items: SeasonalStepDraft[]): SeasonalStepDraftView[] {
  const views: SeasonalStepDraftView[] = [];
  for (const item of items) {
    views.push(toSeasonalStepDraftView(item));
  }
  return views;
}

export function sumSeasonalStepDraftView(view: SeasonalStepDraftView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBid + parsedCapacity;
}
