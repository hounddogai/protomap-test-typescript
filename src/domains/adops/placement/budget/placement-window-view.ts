import * as text from "../../../../kit/text.js";
import { PlacementWindow } from "./placement-window.js";

/** How screens and exports show a placement window. */
export class PlacementWindowView {
  code: string;
  titleText: string;
  pinned: string;
  weight: string;
  endsAtText: string;
  approvedText: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinned: string,
    weight: string,
    endsAtText: string,
    approvedText: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinned = pinned;
    this.weight = weight;
    this.endsAtText = endsAtText;
    this.approvedText = approvedText;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementWindowView(item: PlacementWindow): PlacementWindowView {
  return new PlacementWindowView(
    item.code,
    text.truncate(item.title, 80),
    `${item.pinned}`,
    item.weight.toFixed(2),
    String(item.endsAt),
    `${item.approved}`,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementWindowViews(items: PlacementWindow[]): PlacementWindowView[] {
  const views: PlacementWindowView[] = [];
  for (const item of items) {
    views.push(toPlacementWindowView(item));
  }
  return views;
}

export function sumPlacementWindowView(view: PlacementWindowView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedWeight + parsedEndsAt + parsedBudget;
}
