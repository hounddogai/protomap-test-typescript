import { SeasonalRedemptionSummary } from "./seasonal-redemption-summary.js";

/** How screens and exports show a seasonal redemption summary. */
export class SeasonalRedemptionSummaryView {
  codeText: string;
  titleText: string;
  journeyId: string;
  ratio: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    journeyId: string,
    ratio: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.journeyId = journeyId;
    this.ratio = ratio;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRedemptionSummaryView(item: SeasonalRedemptionSummary): SeasonalRedemptionSummaryView {
  return new SeasonalRedemptionSummaryView(
    item.code,
    item.title,
    item.journeyId,
    item.ratio.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRedemptionSummaryViews(items: SeasonalRedemptionSummary[]): SeasonalRedemptionSummaryView[] {
  const views: SeasonalRedemptionSummaryView[] = [];
  for (const item of items) {
    views.push(toSeasonalRedemptionSummaryView(item));
  }
  return views;
}

export function sumSeasonalRedemptionSummaryView(view: SeasonalRedemptionSummaryView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
