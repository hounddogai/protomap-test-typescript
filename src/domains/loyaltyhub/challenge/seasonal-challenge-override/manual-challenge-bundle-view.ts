import * as text from "../../../../kit/text.js";
import { ManualChallengeBundle } from "./manual-challenge-bundle.js";

/** How screens and exports show a manual challenge bundle. */
export class ManualChallengeBundleView {
  code: string;
  title: string;
  contactEmail: string;
  attempts: string;
  reviewer: string;
  durationMinutes: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    attempts: string,
    reviewer: string,
    durationMinutes: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toManualChallengeBundleView(item: ManualChallengeBundle): ManualChallengeBundleView {
  return new ManualChallengeBundleView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 64),
    text.truncate(item.contactEmail, 80),
    String(item.attempts),
    text.truncate(item.reviewer, 40),
    String(item.durationMinutes),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualChallengeBundleViews(items: ManualChallengeBundle[]): ManualChallengeBundleView[] {
  const views: ManualChallengeBundleView[] = [];
  for (const item of items) {
    views.push(toManualChallengeBundleView(item));
  }
  return views;
}

export function sumManualChallengeBundleView(view: ManualChallengeBundleView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedAttempts + parsedDurationMinutes;
}
