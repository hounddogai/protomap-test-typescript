import * as text from "../../../../kit/text.js";
import { SlaNotice } from "./sla-notice.js";

/** How screens and exports show a sla notice. */
export class SlaNoticeView {
  code: string;
  name: string;
  cohortText: string;
  activeText: string;
  externalRef: string;
  contactEmail: string;
  expiresAtText: string;
  timezoneText: string;
  impressions: string;
  floorValueText: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cohortText: string,
    activeText: string,
    externalRef: string,
    contactEmail: string,
    expiresAtText: string,
    timezoneText: string,
    impressions: string,
    floorValueText: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cohortText = cohortText;
    this.activeText = activeText;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.expiresAtText = expiresAtText;
    this.timezoneText = timezoneText;
    this.impressions = impressions;
    this.floorValueText = floorValueText;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaNoticeView(item: SlaNotice): SlaNoticeView {
  return new SlaNoticeView(
    item.code,
    item.name,
    text.truncate(item.cohort, 40),
    `${item.active}`,
    item.externalRef,
    item.contactEmail,
    String(item.expiresAt),
    text.truncate(item.timezone, 120),
    String(item.impressions),
    item.floorValue.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaNoticeViews(items: SlaNotice[]): SlaNoticeView[] {
  const views: SlaNoticeView[] = [];
  for (const item of items) {
    views.push(toSlaNoticeView(item));
  }
  return views;
}

export function sumSlaNoticeView(view: SlaNoticeView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedExpiresAt + parsedImpressions + parsedFloorValue;
}
