import * as text from "../../../../kit/text.js";
import { RewardRuleSummary } from "./reward-rule-summary.js";

/** How screens and exports show a reward rule summary. */
export class RewardRuleSummaryView {
  code: string;
  title: string;
  locale: string;
  audienceIdText: string;
  createdAtText: string;
  pinned: string;
  impressionsText: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    audienceIdText: string,
    createdAtText: string,
    pinned: string,
    impressionsText: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.audienceIdText = audienceIdText;
    this.createdAtText = createdAtText;
    this.pinned = pinned;
    this.impressionsText = impressionsText;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleSummaryView(item: RewardRuleSummary): RewardRuleSummaryView {
  return new RewardRuleSummaryView(
    text.truncate(item.code, 120),
    item.title,
    item.locale,
    text.truncate(item.audienceId, 80),
    String(item.createdAt),
    `${item.pinned}`,
    String(item.impressions),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleSummaryViews(items: RewardRuleSummary[]): RewardRuleSummaryView[] {
  const views: RewardRuleSummaryView[] = [];
  for (const item of items) {
    views.push(toRewardRuleSummaryView(item));
  }
  return views;
}

export function sumRewardRuleSummaryView(view: RewardRuleSummaryView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedCreatedAt + parsedImpressions;
}
