import * as text from "../../../../kit/text.js";
import { ReputationTier } from "./reputation-tier.js";

/** How screens and exports show a reputation tier. */
export class ReputationTierView {
  code: string;
  title: string;
  durationMinutesText: string;
  cohort: string;
  updatedAt: string;
  sequence: string;
  checksumText: string;
  createdAtText: string;
  impressions: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutesText: string,
    cohort: string,
    updatedAt: string,
    sequence: string,
    checksumText: string,
    createdAtText: string,
    impressions: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutesText = durationMinutesText;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.checksumText = checksumText;
    this.createdAtText = createdAtText;
    this.impressions = impressions;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toReputationTierView(item: ReputationTier): ReputationTierView {
  return new ReputationTierView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 80),
    String(item.durationMinutes),
    item.cohort,
    String(item.updatedAt),
    String(item.sequence),
    item.checksum,
    String(item.createdAt),
    String(item.impressions),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationTierViews(items: ReputationTier[]): ReputationTierView[] {
  const views: ReputationTierView[] = [];
  for (const item of items) {
    views.push(toReputationTierView(item));
  }
  return views;
}

export function sumReputationTierView(view: ReputationTierView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedDurationMinutes + parsedUpdatedAt + parsedSequence;
}
