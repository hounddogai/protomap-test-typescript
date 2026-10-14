import * as text from "../../../../kit/text.js";
import { PrimarySenderRollup } from "./primary-sender-rollup.js";

/** How screens and exports show a primary sender rollup. */
export class PrimarySenderRollupView {
  codeText: string;
  name: string;
  conversionRateText: string;
  sourceText: string;
  utmSource: string;
  locale: string;
  currencyText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    conversionRateText: string,
    sourceText: string,
    utmSource: string,
    locale: string,
    currencyText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.conversionRateText = conversionRateText;
    this.sourceText = sourceText;
    this.utmSource = utmSource;
    this.locale = locale;
    this.currencyText = currencyText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySenderRollupView(item: PrimarySenderRollup): PrimarySenderRollupView {
  return new PrimarySenderRollupView(
    text.truncate(item.code, 120),
    item.name,
    item.conversionRate.toFixed(2),
    text.truncate(item.source, 64),
    text.truncate(item.utmSource, 80),
    item.locale,
    item.currency,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySenderRollupViews(items: PrimarySenderRollup[]): PrimarySenderRollupView[] {
  const views: PrimarySenderRollupView[] = [];
  for (const item of items) {
    views.push(toPrimarySenderRollupView(item));
  }
  return views;
}

export function sumPrimarySenderRollupView(view: PrimarySenderRollupView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedConversionRate;
}
