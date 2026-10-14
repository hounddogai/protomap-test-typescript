import * as text from "../../../../kit/text.js";
import { RollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

/** How screens and exports show a rolling leaderboard draft. */
export class RollingLeaderboardDraftView {
  code: string;
  titleText: string;
  region: string;
  frequencyCap: string;
  visible: string;
  bidText: string;
  attempts: string;
  maximum: string;
  summary: string;
  weight: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    region: string,
    frequencyCap: string,
    visible: string,
    bidText: string,
    attempts: string,
    maximum: string,
    summary: string,
    weight: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.bidText = bidText;
    this.attempts = attempts;
    this.maximum = maximum;
    this.summary = summary;
    this.weight = weight;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toRollingLeaderboardDraftView(item: RollingLeaderboardDraft): RollingLeaderboardDraftView {
  return new RollingLeaderboardDraftView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.region,
    String(item.frequencyCap),
    `${item.visible}`,
    item.bid.toFixed(2),
    String(item.attempts),
    item.maximum.toFixed(2),
    item.summary,
    item.weight.toFixed(2),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingLeaderboardDraftViews(items: RollingLeaderboardDraft[]): RollingLeaderboardDraftView[] {
  const views: RollingLeaderboardDraftView[] = [];
  for (const item of items) {
    views.push(toRollingLeaderboardDraftView(item));
  }
  return views;
}

export function sumRollingLeaderboardDraftView(view: RollingLeaderboardDraftView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedFrequencyCap + parsedBid + parsedAttempts;
}
