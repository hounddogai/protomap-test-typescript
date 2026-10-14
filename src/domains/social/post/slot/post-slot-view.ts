import * as text from "../../../../kit/text.js";
import { PostSlot } from "./post-slot.js";

/** How screens and exports show a post slot. */
export class PostSlotView {
  code: string;
  labelText: string;
  currencyText: string;
  regionText: string;
  minimumText: string;
  rateText: string;
  budget: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    currencyText: string,
    regionText: string,
    minimumText: string,
    rateText: string,
    budget: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.currencyText = currencyText;
    this.regionText = regionText;
    this.minimumText = minimumText;
    this.rateText = rateText;
    this.budget = budget;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPostSlotView(item: PostSlot): PostSlotView {
  return new PostSlotView(
    item.code,
    item.label,
    text.truncate(item.currency, 40),
    text.truncate(item.region, 120),
    item.minimum.toFixed(2),
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostSlotViews(items: PostSlot[]): PostSlotView[] {
  const views: PostSlotView[] = [];
  for (const item of items) {
    views.push(toPostSlotView(item));
  }
  return views;
}

export function sumPostSlotView(view: PostSlotView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedMinimum + parsedRate + parsedBudget;
}
