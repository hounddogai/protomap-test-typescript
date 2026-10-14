import * as text from "../../../../kit/text.js";
import { TieredStepAssignment } from "./tiered-step-assignment.js";

/** How screens and exports show a tiered step assignment. */
export class TieredStepAssignmentView {
  codeText: string;
  nameText: string;
  channel: string;
  impressions: string;
  journeyId: string;
  retries: string;
  durationMinutesText: string;
  contactEmailText: string;
  segment: string;
  visibleText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    channel: string,
    impressions: string,
    journeyId: string,
    retries: string,
    durationMinutesText: string,
    contactEmailText: string,
    segment: string,
    visibleText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.channel = channel;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.retries = retries;
    this.durationMinutesText = durationMinutesText;
    this.contactEmailText = contactEmailText;
    this.segment = segment;
    this.visibleText = visibleText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toTieredStepAssignmentView(item: TieredStepAssignment): TieredStepAssignmentView {
  return new TieredStepAssignmentView(
    text.truncate(item.code, 64),
    item.name,
    item.channel,
    String(item.impressions),
    item.journeyId,
    String(item.retries),
    String(item.durationMinutes),
    text.truncate(item.contactEmail, 120),
    item.segment,
    `${item.visible}`,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredStepAssignmentViews(items: TieredStepAssignment[]): TieredStepAssignmentView[] {
  const views: TieredStepAssignmentView[] = [];
  for (const item of items) {
    views.push(toTieredStepAssignmentView(item));
  }
  return views;
}

export function sumTieredStepAssignmentView(view: TieredStepAssignmentView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedImpressions + parsedRetries + parsedDurationMinutes;
}
