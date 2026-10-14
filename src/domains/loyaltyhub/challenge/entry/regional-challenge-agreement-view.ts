import * as text from "../../../../kit/text.js";
import { RegionalChallengeAgreement } from "./regional-challenge-agreement.js";

/** How screens and exports show a regional challenge agreement. */
export class RegionalChallengeAgreementView {
  code: string;
  name: string;
  variantText: string;
  campaignRefText: string;
  country: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    variantText: string,
    campaignRefText: string,
    country: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.variantText = variantText;
    this.campaignRefText = campaignRefText;
    this.country = country;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalChallengeAgreementView(item: RegionalChallengeAgreement): RegionalChallengeAgreementView {
  return new RegionalChallengeAgreementView(
    text.truncate(item.code, 80),
    item.name,
    item.variant,
    item.campaignRef,
    item.country,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalChallengeAgreementViews(items: RegionalChallengeAgreement[]): RegionalChallengeAgreementView[] {
  const views: RegionalChallengeAgreementView[] = [];
  for (const item of items) {
    views.push(toRegionalChallengeAgreementView(item));
  }
  return views;
}

export function sumRegionalChallengeAgreementView(view: RegionalChallengeAgreementView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
