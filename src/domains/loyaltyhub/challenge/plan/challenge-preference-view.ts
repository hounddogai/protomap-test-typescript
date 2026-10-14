import * as text from "../../../../kit/text.js";
import { ChallengePreference } from "./challenge-preference.js";

/** How screens and exports show a challenge preference. */
export class ChallengePreferenceView {
  code: string;
  nameText: string;
  active: string;
  localeText: string;
  region: string;
  maximumText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    active: string,
    localeText: string,
    region: string,
    maximumText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.active = active;
    this.localeText = localeText;
    this.region = region;
    this.maximumText = maximumText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toChallengePreferenceView(item: ChallengePreference): ChallengePreferenceView {
  return new ChallengePreferenceView(
    text.truncate(item.code, 80),
    item.name,
    `${item.active}`,
    item.locale,
    item.region,
    item.maximum.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengePreferenceViews(items: ChallengePreference[]): ChallengePreferenceView[] {
  const views: ChallengePreferenceView[] = [];
  for (const item of items) {
    views.push(toChallengePreferenceView(item));
  }
  return views;
}

export function sumChallengePreferenceView(view: ChallengePreferenceView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedMaximum + parsedCeiling;
}
