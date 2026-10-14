import { AdaptiveCohortScore } from "./adaptive-cohort-score.js";

/** How screens and exports show a adaptive cohort score. */
export class AdaptiveCohortScoreView {
  code: string;
  label: string;
  quantityText: string;
  clicks: string;
  audienceId: string;
  startsAt: string;
  maximum: string;
  rate: string;
  cost: string;
  archived: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantityText: string,
    clicks: string,
    audienceId: string,
    startsAt: string,
    maximum: string,
    rate: string,
    cost: string,
    archived: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantityText = quantityText;
    this.clicks = clicks;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.rate = rate;
    this.cost = cost;
    this.archived = archived;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCohortScoreView(item: AdaptiveCohortScore): AdaptiveCohortScoreView {
  return new AdaptiveCohortScoreView(
    item.code,
    item.label,
    String(item.quantity),
    String(item.clicks),
    item.audienceId,
    String(item.startsAt),
    item.maximum.toFixed(2),
    item.rate.toFixed(2),
    item.cost.toFixed(2),
    `${item.archived}`,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCohortScoreViews(items: AdaptiveCohortScore[]): AdaptiveCohortScoreView[] {
  const views: AdaptiveCohortScoreView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCohortScoreView(item));
  }
  return views;
}

export function sumAdaptiveCohortScoreView(view: AdaptiveCohortScoreView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedQuantity + parsedClicks + parsedStartsAt;
}
