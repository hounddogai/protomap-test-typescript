import * as text from "../../../../kit/text.js";
import { StrictPaywallNotice } from "./strict-paywall-notice.js";

/** How screens and exports show a strict paywall notice. */
export class StrictPaywallNoticeView {
  code: string;
  title: string;
  openRateText: string;
  phone: string;
  startsAt: string;
  campaignRef: string;
  scoreText: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRateText: string,
    phone: string,
    startsAt: string,
    campaignRef: string,
    scoreText: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRateText = openRateText;
    this.phone = phone;
    this.startsAt = startsAt;
    this.campaignRef = campaignRef;
    this.scoreText = scoreText;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPaywallNoticeView(item: StrictPaywallNotice): StrictPaywallNoticeView {
  return new StrictPaywallNoticeView(
    text.truncate(item.code, 120),
    item.title,
    item.openRate.toFixed(2),
    item.phone,
    String(item.startsAt),
    item.campaignRef,
    item.score.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPaywallNoticeViews(items: StrictPaywallNotice[]): StrictPaywallNoticeView[] {
  const views: StrictPaywallNoticeView[] = [];
  for (const item of items) {
    views.push(toStrictPaywallNoticeView(item));
  }
  return views;
}

export function sumStrictPaywallNoticeView(view: StrictPaywallNoticeView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedOpenRate + parsedStartsAt + parsedScore;
}
