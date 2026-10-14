import { WindowGroup } from "./window-group.js";

/** How screens and exports show a window group. */
export class WindowGroupView {
  code: string;
  name: string;
  locale: string;
  score: string;
  maximum: string;
  costText: string;
  source: string;
  campaignRef: string;
  floorValue: string;
  summary: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    score: string,
    maximum: string,
    costText: string,
    source: string,
    campaignRef: string,
    floorValue: string,
    summary: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.score = score;
    this.maximum = maximum;
    this.costText = costText;
    this.source = source;
    this.campaignRef = campaignRef;
    this.floorValue = floorValue;
    this.summary = summary;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toWindowGroupView(item: WindowGroup): WindowGroupView {
  return new WindowGroupView(
    item.code,
    item.name,
    item.locale,
    item.score.toFixed(2),
    item.maximum.toFixed(2),
    item.cost.toFixed(2),
    item.source,
    item.campaignRef,
    item.floorValue.toFixed(2),
    item.summary,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowGroupViews(items: WindowGroup[]): WindowGroupView[] {
  const views: WindowGroupView[] = [];
  for (const item of items) {
    views.push(toWindowGroupView(item));
  }
  return views;
}

export function sumWindowGroupView(view: WindowGroupView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedScore + parsedMaximum + parsedCost;
}
