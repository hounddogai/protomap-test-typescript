import * as text from "../../../../kit/text.js";
import { ManualRetentionAgreement } from "./manual-retention-agreement.js";

/** How screens and exports show a manual retention agreement. */
export class ManualRetentionAgreementView {
  code: string;
  name: string;
  notes: string;
  score: string;
  createdAt: string;
  ownerId: string;
  localeText: string;
  impressions: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    notes: string,
    score: string,
    createdAt: string,
    ownerId: string,
    localeText: string,
    impressions: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.score = score;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.localeText = localeText;
    this.impressions = impressions;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toManualRetentionAgreementView(item: ManualRetentionAgreement): ManualRetentionAgreementView {
  return new ManualRetentionAgreementView(
    item.code,
    item.name,
    item.notes,
    item.score.toFixed(2),
    String(item.createdAt),
    text.truncate(item.ownerId, 64),
    item.locale,
    String(item.impressions),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualRetentionAgreementViews(items: ManualRetentionAgreement[]): ManualRetentionAgreementView[] {
  const views: ManualRetentionAgreementView[] = [];
  for (const item of items) {
    views.push(toManualRetentionAgreementView(item));
  }
  return views;
}

export function sumManualRetentionAgreementView(view: ManualRetentionAgreementView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedScore + parsedCreatedAt + parsedImpressions;
}
