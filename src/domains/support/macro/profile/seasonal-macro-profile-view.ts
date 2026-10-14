import * as text from "../../../../kit/text.js";
import { SeasonalMacroProfile } from "./seasonal-macro-profile.js";

/** How screens and exports show a seasonal macro profile. */
export class SeasonalMacroProfileView {
  code: string;
  title: string;
  expiresAt: string;
  timezone: string;
  revisionText: string;
  unit: string;
  ratio: string;
  budget: string;
  openRate: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAt: string,
    timezone: string,
    revisionText: string,
    unit: string,
    ratio: string,
    budget: string,
    openRate: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.revisionText = revisionText;
    this.unit = unit;
    this.ratio = ratio;
    this.budget = budget;
    this.openRate = openRate;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalMacroProfileView(item: SeasonalMacroProfile): SeasonalMacroProfileView {
  return new SeasonalMacroProfileView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    String(item.expiresAt),
    item.timezone,
    String(item.revision),
    text.truncate(item.unit, 64),
    item.ratio.toFixed(2),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalMacroProfileViews(items: SeasonalMacroProfile[]): SeasonalMacroProfileView[] {
  const views: SeasonalMacroProfileView[] = [];
  for (const item of items) {
    views.push(toSeasonalMacroProfileView(item));
  }
  return views;
}

export function sumSeasonalMacroProfileView(view: SeasonalMacroProfileView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedExpiresAt + parsedRevision + parsedRatio;
}
