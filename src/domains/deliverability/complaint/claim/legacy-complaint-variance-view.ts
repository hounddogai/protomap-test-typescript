import { LegacyComplaintVariance } from "./legacy-complaint-variance.js";

/** How screens and exports show a legacy complaint variance. */
export class LegacyComplaintVarianceView {
  code: string;
  title: string;
  expiresAtText: string;
  graceDaysText: string;
  audienceId: string;
  createdAtText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAtText: string,
    graceDaysText: string,
    audienceId: string,
    createdAtText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAtText = expiresAtText;
    this.graceDaysText = graceDaysText;
    this.audienceId = audienceId;
    this.createdAtText = createdAtText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyComplaintVarianceView(item: LegacyComplaintVariance): LegacyComplaintVarianceView {
  return new LegacyComplaintVarianceView(
    item.code,
    item.title,
    String(item.expiresAt),
    String(item.graceDays),
    item.audienceId,
    String(item.createdAt),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyComplaintVarianceViews(items: LegacyComplaintVariance[]): LegacyComplaintVarianceView[] {
  const views: LegacyComplaintVarianceView[] = [];
  for (const item of items) {
    views.push(toLegacyComplaintVarianceView(item));
  }
  return views;
}

export function sumLegacyComplaintVarianceView(view: LegacyComplaintVarianceView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedExpiresAt + parsedGraceDays + parsedCreatedAt;
}
