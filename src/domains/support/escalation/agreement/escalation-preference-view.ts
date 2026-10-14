import * as text from "../../../../kit/text.js";
import { EscalationPreference } from "./escalation-preference.js";

/** How screens and exports show a escalation preference. */
export class EscalationPreferenceView {
  code: string;
  label: string;
  description: string;
  currency: string;
  ratio: string;
  expiresAtText: string;
  archivedText: string;
  pinned: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    description: string,
    currency: string,
    ratio: string,
    expiresAtText: string,
    archivedText: string,
    pinned: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.currency = currency;
    this.ratio = ratio;
    this.expiresAtText = expiresAtText;
    this.archivedText = archivedText;
    this.pinned = pinned;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationPreferenceView(item: EscalationPreference): EscalationPreferenceView {
  return new EscalationPreferenceView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.description, 120),
    item.currency,
    item.ratio.toFixed(2),
    String(item.expiresAt),
    `${item.archived}`,
    `${item.pinned}`,
    text.truncate(item.cohort, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationPreferenceViews(items: EscalationPreference[]): EscalationPreferenceView[] {
  const views: EscalationPreferenceView[] = [];
  for (const item of items) {
    views.push(toEscalationPreferenceView(item));
  }
  return views;
}

export function sumEscalationPreferenceView(view: EscalationPreferenceView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedRatio + parsedExpiresAt;
}
