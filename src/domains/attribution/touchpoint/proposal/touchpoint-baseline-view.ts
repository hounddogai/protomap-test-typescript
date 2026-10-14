import * as text from "../../../../kit/text.js";
import { TouchpointBaseline } from "./touchpoint-baseline.js";

/** How screens and exports show a touchpoint baseline. */
export class TouchpointBaselineView {
  code: string;
  name: string;
  openRate: string;
  unit: string;
  updatedAt: string;
  cohortText: string;
  endsAt: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    openRate: string,
    unit: string,
    updatedAt: string,
    cohortText: string,
    endsAt: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.unit = unit;
    this.updatedAt = updatedAt;
    this.cohortText = cohortText;
    this.endsAt = endsAt;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointBaselineView(item: TouchpointBaseline): TouchpointBaselineView {
  return new TouchpointBaselineView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    text.truncate(item.unit, 40),
    String(item.updatedAt),
    item.cohort,
    String(item.endsAt),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointBaselineViews(items: TouchpointBaseline[]): TouchpointBaselineView[] {
  const views: TouchpointBaselineView[] = [];
  for (const item of items) {
    views.push(toTouchpointBaselineView(item));
  }
  return views;
}

export function sumTouchpointBaselineView(view: TouchpointBaselineView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedOpenRate + parsedUpdatedAt + parsedEndsAt;
}
