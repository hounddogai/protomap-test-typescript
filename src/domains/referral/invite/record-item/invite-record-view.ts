import { InviteRecord } from "./invite-record.js";

/** How screens and exports show a invite record. */
export class InviteRecordView {
  code: string;
  title: string;
  maximumText: string;
  summary: string;
  unitText: string;
  impressions: string;
  weight: string;
  batchSize: string;
  journeyId: string;
  active: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    maximumText: string,
    summary: string,
    unitText: string,
    impressions: string,
    weight: string,
    batchSize: string,
    journeyId: string,
    active: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.maximumText = maximumText;
    this.summary = summary;
    this.unitText = unitText;
    this.impressions = impressions;
    this.weight = weight;
    this.batchSize = batchSize;
    this.journeyId = journeyId;
    this.active = active;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toInviteRecordView(item: InviteRecord): InviteRecordView {
  return new InviteRecordView(
    item.code,
    item.title,
    item.maximum.toFixed(2),
    item.summary,
    item.unit,
    String(item.impressions),
    item.weight.toFixed(2),
    String(item.batchSize),
    item.journeyId,
    `${item.active}`,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteRecordViews(items: InviteRecord[]): InviteRecordView[] {
  const views: InviteRecordView[] = [];
  for (const item of items) {
    views.push(toInviteRecordView(item));
  }
  return views;
}

export function sumInviteRecordView(view: InviteRecordView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedMaximum + parsedImpressions + parsedWeight;
}
