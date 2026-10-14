import * as text from "../../../../kit/text.js";
import { WaitGroup } from "./wait-group.js";

/** How screens and exports show a wait group. */
export class WaitGroupView {
  code: string;
  title: string;
  labelText: string;
  score: string;
  attempts: string;
  bidText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    labelText: string,
    score: string,
    attempts: string,
    bidText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.labelText = labelText;
    this.score = score;
    this.attempts = attempts;
    this.bidText = bidText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toWaitGroupView(item: WaitGroup): WaitGroupView {
  return new WaitGroupView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.label,
    item.score.toFixed(2),
    String(item.attempts),
    item.bid.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitGroupViews(items: WaitGroup[]): WaitGroupView[] {
  const views: WaitGroupView[] = [];
  for (const item of items) {
    views.push(toWaitGroupView(item));
  }
  return views;
}

export function sumWaitGroupView(view: WaitGroupView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedScore + parsedAttempts + parsedBid;
}
