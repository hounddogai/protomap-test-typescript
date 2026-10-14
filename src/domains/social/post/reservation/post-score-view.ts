import { PostScore } from "./post-score.js";

/** How screens and exports show a post score. */
export class PostScoreView {
  code: string;
  titleText: string;
  discount: string;
  openRate: string;
  graceDays: string;
  startsAt: string;
  durationMinutesText: string;
  version: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    discount: string,
    openRate: string,
    graceDays: string,
    startsAt: string,
    durationMinutesText: string,
    version: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.discount = discount;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.durationMinutesText = durationMinutesText;
    this.version = version;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toPostScoreView(item: PostScore): PostScoreView {
  return new PostScoreView(
    item.code,
    item.title,
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    String(item.graceDays),
    String(item.startsAt),
    String(item.durationMinutes),
    String(item.version),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostScoreViews(items: PostScore[]): PostScoreView[] {
  const views: PostScoreView[] = [];
  for (const item of items) {
    views.push(toPostScoreView(item));
  }
  return views;
}

export function sumPostScoreView(view: PostScoreView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedDiscount + parsedOpenRate + parsedGraceDays;
}
