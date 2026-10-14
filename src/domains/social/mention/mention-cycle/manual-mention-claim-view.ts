import * as text from "../../../../kit/text.js";
import { ManualMentionClaim } from "./manual-mention-claim.js";

/** How screens and exports show a manual mention claim. */
export class ManualMentionClaimView {
  code: string;
  nameText: string;
  journeyIdText: string;
  localeText: string;
  durationMinutesText: string;
  title: string;
  archivedText: string;
  attempts: string;
  endsAtText: string;
  expiresAt: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    journeyIdText: string,
    localeText: string,
    durationMinutesText: string,
    title: string,
    archivedText: string,
    attempts: string,
    endsAtText: string,
    expiresAt: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.journeyIdText = journeyIdText;
    this.localeText = localeText;
    this.durationMinutesText = durationMinutesText;
    this.title = title;
    this.archivedText = archivedText;
    this.attempts = attempts;
    this.endsAtText = endsAtText;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toManualMentionClaimView(item: ManualMentionClaim): ManualMentionClaimView {
  return new ManualMentionClaimView(
    item.code,
    text.truncate(item.name, 120),
    item.journeyId,
    item.locale,
    String(item.durationMinutes),
    text.truncate(item.title, 120),
    `${item.archived}`,
    String(item.attempts),
    String(item.endsAt),
    String(item.expiresAt),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualMentionClaimViews(items: ManualMentionClaim[]): ManualMentionClaimView[] {
  const views: ManualMentionClaimView[] = [];
  for (const item of items) {
    views.push(toManualMentionClaimView(item));
  }
  return views;
}

export function sumManualMentionClaimView(view: ManualMentionClaimView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedDurationMinutes + parsedAttempts + parsedEndsAt;
}
