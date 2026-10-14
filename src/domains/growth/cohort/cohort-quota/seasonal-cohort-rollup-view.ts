import { SeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

/** How screens and exports show a seasonal cohort rollup. */
export class SeasonalCohortRollupView {
  code: string;
  name: string;
  journeyId: string;
  channelText: string;
  summary: string;
  reviewer: string;
  updatedAt: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    channelText: string,
    summary: string,
    reviewer: string,
    updatedAt: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.channelText = channelText;
    this.summary = summary;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCohortRollupView(item: SeasonalCohortRollup): SeasonalCohortRollupView {
  return new SeasonalCohortRollupView(
    item.code,
    item.name,
    item.journeyId,
    item.channel,
    item.summary,
    item.reviewer,
    String(item.updatedAt),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCohortRollupViews(items: SeasonalCohortRollup[]): SeasonalCohortRollupView[] {
  const views: SeasonalCohortRollupView[] = [];
  for (const item of items) {
    views.push(toSeasonalCohortRollupView(item));
  }
  return views;
}

export function sumSeasonalCohortRollupView(view: SeasonalCohortRollupView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
