import * as text from "../../../../kit/text.js";
import { SeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

/** How screens and exports show a seasonal touchpoint plan. */
export class SeasonalTouchpointPlanView {
  code: string;
  title: string;
  countryText: string;
  segment: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    countryText: string,
    segment: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.countryText = countryText;
    this.segment = segment;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalTouchpointPlanView(item: SeasonalTouchpointPlan): SeasonalTouchpointPlanView {
  return new SeasonalTouchpointPlanView(
    item.code,
    text.truncate(item.title, 80),
    item.country,
    text.truncate(item.segment, 80),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalTouchpointPlanViews(items: SeasonalTouchpointPlan[]): SeasonalTouchpointPlanView[] {
  const views: SeasonalTouchpointPlanView[] = [];
  for (const item of items) {
    views.push(toSeasonalTouchpointPlanView(item));
  }
  return views;
}

export function sumSeasonalTouchpointPlanView(view: SeasonalTouchpointPlanView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedBid;
}
