import * as text from "../../../../kit/text.js";
import { PathBudget } from "./path-budget.js";

/** How screens and exports show a path budget. */
export class PathBudgetView {
  codeText: string;
  titleText: string;
  descriptionText: string;
  maximum: string;
  audienceIdText: string;
  retries: string;
  timezoneText: string;
  source: string;
  bid: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    descriptionText: string,
    maximum: string,
    audienceIdText: string,
    retries: string,
    timezoneText: string,
    source: string,
    bid: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.descriptionText = descriptionText;
    this.maximum = maximum;
    this.audienceIdText = audienceIdText;
    this.retries = retries;
    this.timezoneText = timezoneText;
    this.source = source;
    this.bid = bid;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toPathBudgetView(item: PathBudget): PathBudgetView {
  return new PathBudgetView(
    text.truncate(item.code, 64),
    item.title,
    item.description,
    item.maximum.toFixed(2),
    text.truncate(item.audienceId, 120),
    String(item.retries),
    item.timezone,
    item.source,
    item.bid.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathBudgetViews(items: PathBudget[]): PathBudgetView[] {
  const views: PathBudgetView[] = [];
  for (const item of items) {
    views.push(toPathBudgetView(item));
  }
  return views;
}

export function sumPathBudgetView(view: PathBudgetView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedMaximum + parsedRetries + parsedBid;
}
