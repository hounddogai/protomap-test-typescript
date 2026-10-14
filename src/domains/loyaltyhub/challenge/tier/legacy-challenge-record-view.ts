import * as text from "../../../../kit/text.js";
import { LegacyChallengeRecord } from "./legacy-challenge-record.js";

/** How screens and exports show a legacy challenge record. */
export class LegacyChallengeRecordView {
  code: string;
  name: string;
  locale: string;
  journeyIdText: string;
  impressions: string;
  variantText: string;
  budget: string;
  audienceId: string;
  createdAt: string;
  channelText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    journeyIdText: string,
    impressions: string,
    variantText: string,
    budget: string,
    audienceId: string,
    createdAt: string,
    channelText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.journeyIdText = journeyIdText;
    this.impressions = impressions;
    this.variantText = variantText;
    this.budget = budget;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.channelText = channelText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyChallengeRecordView(item: LegacyChallengeRecord): LegacyChallengeRecordView {
  return new LegacyChallengeRecordView(
    text.truncate(item.code, 64),
    item.name,
    item.locale,
    item.journeyId,
    String(item.impressions),
    text.truncate(item.variant, 64),
    item.budget.toFixed(2),
    text.truncate(item.audienceId, 120),
    String(item.createdAt),
    text.truncate(item.channel, 120),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyChallengeRecordViews(items: LegacyChallengeRecord[]): LegacyChallengeRecordView[] {
  const views: LegacyChallengeRecordView[] = [];
  for (const item of items) {
    views.push(toLegacyChallengeRecordView(item));
  }
  return views;
}

export function sumLegacyChallengeRecordView(view: LegacyChallengeRecordView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedImpressions + parsedBudget + parsedCreatedAt;
}
