import * as text from "../../../../kit/text.js";
import { LegacyComplaintDraft } from "./legacy-complaint-draft.js";

/** How screens and exports show a legacy complaint draft. */
export class LegacyComplaintDraftView {
  codeText: string;
  title: string;
  limitText: string;
  checksum: string;
  openRate: string;
  utmSourceText: string;
  country: string;
  windowDays: string;
  archived: string;
  channel: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    limitText: string,
    checksum: string,
    openRate: string,
    utmSourceText: string,
    country: string,
    windowDays: string,
    archived: string,
    channel: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.limitText = limitText;
    this.checksum = checksum;
    this.openRate = openRate;
    this.utmSourceText = utmSourceText;
    this.country = country;
    this.windowDays = windowDays;
    this.archived = archived;
    this.channel = channel;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyComplaintDraftView(item: LegacyComplaintDraft): LegacyComplaintDraftView {
  return new LegacyComplaintDraftView(
    item.code,
    item.title,
    String(item.limit),
    item.checksum,
    item.openRate.toFixed(2),
    item.utmSource,
    text.truncate(item.country, 40),
    String(item.windowDays),
    `${item.archived}`,
    item.channel,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyComplaintDraftViews(items: LegacyComplaintDraft[]): LegacyComplaintDraftView[] {
  const views: LegacyComplaintDraftView[] = [];
  for (const item of items) {
    views.push(toLegacyComplaintDraftView(item));
  }
  return views;
}

export function sumLegacyComplaintDraftView(view: LegacyComplaintDraftView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedLimit + parsedOpenRate + parsedWindowDays;
}
