import * as text from "../../../../kit/text.js";
import { StrictPacingRollup } from "./strict-pacing-rollup.js";

/** How screens and exports show a strict pacing rollup. */
export class StrictPacingRollupView {
  code: string;
  titleText: string;
  phone: string;
  cohort: string;
  conversionRate: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    phone: string,
    cohort: string,
    conversionRate: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.phone = phone;
    this.cohort = cohort;
    this.conversionRate = conversionRate;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPacingRollupView(item: StrictPacingRollup): StrictPacingRollupView {
  return new StrictPacingRollupView(
    item.code,
    text.truncate(item.title, 80),
    item.phone,
    item.cohort,
    item.conversionRate.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPacingRollupViews(items: StrictPacingRollup[]): StrictPacingRollupView[] {
  const views: StrictPacingRollupView[] = [];
  for (const item of items) {
    views.push(toStrictPacingRollupView(item));
  }
  return views;
}

export function sumStrictPacingRollupView(view: StrictPacingRollupView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedConversionRate;
}
