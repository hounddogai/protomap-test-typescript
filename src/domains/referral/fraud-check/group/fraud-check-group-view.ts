import { FraudCheckGroup } from "./fraud-check-group.js";

/** How screens and exports show a fraud check group. */
export class FraudCheckGroupView {
  code: string;
  title: string;
  threshold: string;
  score: string;
  locale: string;
  campaignRef: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    threshold: string,
    score: string,
    locale: string,
    campaignRef: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.score = score;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckGroupView(item: FraudCheckGroup): FraudCheckGroupView {
  return new FraudCheckGroupView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    item.score.toFixed(2),
    item.locale,
    item.campaignRef,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckGroupViews(items: FraudCheckGroup[]): FraudCheckGroupView[] {
  const views: FraudCheckGroupView[] = [];
  for (const item of items) {
    views.push(toFraudCheckGroupView(item));
  }
  return views;
}

export function sumFraudCheckGroupView(view: FraudCheckGroupView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedThreshold + parsedScore;
}
