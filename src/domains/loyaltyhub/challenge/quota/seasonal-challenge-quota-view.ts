import * as text from "../../../../kit/text.js";
import { SeasonalChallengeQuota } from "./seasonal-challenge-quota.js";

/** How screens and exports show a seasonal challenge quota. */
export class SeasonalChallengeQuotaView {
  codeText: string;
  name: string;
  externalRef: string;
  visible: string;
  frequencyCap: string;
  reviewer: string;
  expiresAtText: string;
  ratio: string;
  countryText: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    externalRef: string,
    visible: string,
    frequencyCap: string,
    reviewer: string,
    expiresAtText: string,
    ratio: string,
    countryText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.externalRef = externalRef;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.expiresAtText = expiresAtText;
    this.ratio = ratio;
    this.countryText = countryText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalChallengeQuotaView(item: SeasonalChallengeQuota): SeasonalChallengeQuotaView {
  return new SeasonalChallengeQuotaView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.externalRef, 120),
    `${item.visible}`,
    String(item.frequencyCap),
    item.reviewer,
    String(item.expiresAt),
    item.ratio.toFixed(2),
    text.truncate(item.country, 120),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalChallengeQuotaViews(items: SeasonalChallengeQuota[]): SeasonalChallengeQuotaView[] {
  const views: SeasonalChallengeQuotaView[] = [];
  for (const item of items) {
    views.push(toSeasonalChallengeQuotaView(item));
  }
  return views;
}

export function sumSeasonalChallengeQuotaView(view: SeasonalChallengeQuotaView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedFrequencyCap + parsedExpiresAt + parsedRatio;
}
