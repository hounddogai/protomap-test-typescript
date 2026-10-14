import * as text from "../../../../kit/text.js";
import { CappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

/** How screens and exports show a capped leaderboard notice. */
export class CappedLeaderboardNoticeView {
  codeText: string;
  label: string;
  channelText: string;
  utmSource: string;
  threshold: string;
  sendAtText: string;
  budget: string;
  version: string;
  visible: string;
  checksumText: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    channelText: string,
    utmSource: string,
    threshold: string,
    sendAtText: string,
    budget: string,
    version: string,
    visible: string,
    checksumText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.channelText = channelText;
    this.utmSource = utmSource;
    this.threshold = threshold;
    this.sendAtText = sendAtText;
    this.budget = budget;
    this.version = version;
    this.visible = visible;
    this.checksumText = checksumText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toCappedLeaderboardNoticeView(item: CappedLeaderboardNotice): CappedLeaderboardNoticeView {
  return new CappedLeaderboardNoticeView(
    item.code,
    item.label,
    item.channel,
    item.utmSource,
    item.threshold.toFixed(2),
    String(item.sendAt),
    item.budget.toFixed(2),
    String(item.version),
    `${item.visible}`,
    item.checksum,
    text.truncate(item.unit, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedLeaderboardNoticeViews(items: CappedLeaderboardNotice[]): CappedLeaderboardNoticeView[] {
  const views: CappedLeaderboardNoticeView[] = [];
  for (const item of items) {
    views.push(toCappedLeaderboardNoticeView(item));
  }
  return views;
}

export function sumCappedLeaderboardNoticeView(view: CappedLeaderboardNoticeView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedThreshold + parsedSendAt + parsedBudget;
}
