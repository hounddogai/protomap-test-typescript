import * as text from "../../../../kit/text.js";
import { DefaultPlacementEstimate } from "./default-placement-estimate.js";

/** How screens and exports show a default placement estimate. */
export class DefaultPlacementEstimateView {
  code: string;
  labelText: string;
  locale: string;
  score: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    score: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.score = score;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPlacementEstimateView(item: DefaultPlacementEstimate): DefaultPlacementEstimateView {
  return new DefaultPlacementEstimateView(
    text.truncate(item.code, 40),
    item.label,
    item.locale,
    item.score.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPlacementEstimateViews(items: DefaultPlacementEstimate[]): DefaultPlacementEstimateView[] {
  const views: DefaultPlacementEstimateView[] = [];
  for (const item of items) {
    views.push(toDefaultPlacementEstimateView(item));
  }
  return views;
}

export function sumDefaultPlacementEstimateView(view: DefaultPlacementEstimateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedScore + parsedUpdatedAt;
}
