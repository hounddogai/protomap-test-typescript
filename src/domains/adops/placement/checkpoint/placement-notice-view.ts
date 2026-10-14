import * as text from "../../../../kit/text.js";
import { PlacementNotice } from "./placement-notice.js";

/** How screens and exports show a placement notice. */
export class PlacementNoticeView {
  code: string;
  name: string;
  clicks: string;
  budgetText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    clicks: string,
    budgetText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.budgetText = budgetText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementNoticeView(item: PlacementNotice): PlacementNoticeView {
  return new PlacementNoticeView(
    text.truncate(item.code, 64),
    item.name,
    String(item.clicks),
    item.budget.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementNoticeViews(items: PlacementNotice[]): PlacementNoticeView[] {
  const views: PlacementNoticeView[] = [];
  for (const item of items) {
    views.push(toPlacementNoticeView(item));
  }
  return views;
}

export function sumPlacementNoticeView(view: PlacementNoticeView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedClicks + parsedBudget;
}
