import { SeasonalWarmupWindow } from "./seasonal-warmup-window.js";

/** How screens and exports show a seasonal warmup window. */
export class SeasonalWarmupWindowView {
  code: string;
  titleText: string;
  locale: string;
  ratio: string;
  ownerIdText: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    locale: string,
    ratio: string,
    ownerIdText: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.locale = locale;
    this.ratio = ratio;
    this.ownerIdText = ownerIdText;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalWarmupWindowView(item: SeasonalWarmupWindow): SeasonalWarmupWindowView {
  return new SeasonalWarmupWindowView(
    item.code,
    item.title,
    item.locale,
    item.ratio.toFixed(2),
    item.ownerId,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalWarmupWindowViews(items: SeasonalWarmupWindow[]): SeasonalWarmupWindowView[] {
  const views: SeasonalWarmupWindowView[] = [];
  for (const item of items) {
    views.push(toSeasonalWarmupWindowView(item));
  }
  return views;
}

export function sumSeasonalWarmupWindowView(view: SeasonalWarmupWindowView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
