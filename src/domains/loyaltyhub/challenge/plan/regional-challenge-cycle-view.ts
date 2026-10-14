import { RegionalChallengeCycle } from "./regional-challenge-cycle.js";

/** How screens and exports show a regional challenge cycle. */
export class RegionalChallengeCycleView {
  code: string;
  titleText: string;
  journeyId: string;
  currencyText: string;
  categoryText: string;
  name: string;
  retries: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    journeyId: string,
    currencyText: string,
    categoryText: string,
    name: string,
    retries: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.journeyId = journeyId;
    this.currencyText = currencyText;
    this.categoryText = categoryText;
    this.name = name;
    this.retries = retries;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalChallengeCycleView(item: RegionalChallengeCycle): RegionalChallengeCycleView {
  return new RegionalChallengeCycleView(
    item.code,
    item.title,
    item.journeyId,
    item.currency,
    item.category,
    item.name,
    String(item.retries),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalChallengeCycleViews(items: RegionalChallengeCycle[]): RegionalChallengeCycleView[] {
  const views: RegionalChallengeCycleView[] = [];
  for (const item of items) {
    views.push(toRegionalChallengeCycleView(item));
  }
  return views;
}

export function sumRegionalChallengeCycleView(view: RegionalChallengeCycleView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRetries + parsedBid;
}
