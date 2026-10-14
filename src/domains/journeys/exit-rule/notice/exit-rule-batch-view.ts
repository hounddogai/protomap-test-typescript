import * as text from "../../../../kit/text.js";
import { ExitRuleBatch } from "./exit-rule-batch.js";

/** How screens and exports show a exit rule batch. */
export class ExitRuleBatchView {
  codeText: string;
  name: string;
  archived: string;
  margin: string;
  ownerId: string;
  ceiling: string;
  title: string;
  segmentText: string;
  clicks: string;
  currencyText: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    archived: string,
    margin: string,
    ownerId: string,
    ceiling: string,
    title: string,
    segmentText: string,
    clicks: string,
    currencyText: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.archived = archived;
    this.margin = margin;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.title = title;
    this.segmentText = segmentText;
    this.clicks = clicks;
    this.currencyText = currencyText;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleBatchView(item: ExitRuleBatch): ExitRuleBatchView {
  return new ExitRuleBatchView(
    item.code,
    text.truncate(item.name, 120),
    `${item.archived}`,
    item.margin.toFixed(2),
    text.truncate(item.ownerId, 64),
    item.ceiling.toFixed(2),
    item.title,
    item.segment,
    String(item.clicks),
    item.currency,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleBatchViews(items: ExitRuleBatch[]): ExitRuleBatchView[] {
  const views: ExitRuleBatchView[] = [];
  for (const item of items) {
    views.push(toExitRuleBatchView(item));
  }
  return views;
}

export function sumExitRuleBatchView(view: ExitRuleBatchView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedMargin + parsedCeiling + parsedClicks;
}
