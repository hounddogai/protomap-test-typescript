import * as text from "../../../../kit/text.js";
import { CappedOptOutRequest } from "./capped-opt-out-request.js";

/** How screens and exports show a capped opt out request. */
export class CappedOptOutRequestView {
  code: string;
  title: string;
  score: string;
  limit: string;
  externalRef: string;
  campaignRef: string;
  activeText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    score: string,
    limit: string,
    externalRef: string,
    campaignRef: string,
    activeText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.limit = limit;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.activeText = activeText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedOptOutRequestView(item: CappedOptOutRequest): CappedOptOutRequestView {
  return new CappedOptOutRequestView(
    text.truncate(item.code, 64),
    item.title,
    item.score.toFixed(2),
    String(item.limit),
    text.truncate(item.externalRef, 120),
    item.campaignRef,
    `${item.active}`,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedOptOutRequestViews(items: CappedOptOutRequest[]): CappedOptOutRequestView[] {
  const views: CappedOptOutRequestView[] = [];
  for (const item of items) {
    views.push(toCappedOptOutRequestView(item));
  }
  return views;
}

export function sumCappedOptOutRequestView(view: CappedOptOutRequestView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedScore + parsedLimit;
}
