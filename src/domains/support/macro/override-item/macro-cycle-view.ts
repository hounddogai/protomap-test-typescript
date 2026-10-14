import { MacroCycle } from "./macro-cycle.js";

/** How screens and exports show a macro cycle. */
export class MacroCycleView {
  codeText: string;
  label: string;
  conversionRate: string;
  variantText: string;
  limitText: string;
  updatedAt: string;
  summaryText: string;
  journeyIdText: string;
  title: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    conversionRate: string,
    variantText: string,
    limitText: string,
    updatedAt: string,
    summaryText: string,
    journeyIdText: string,
    title: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.conversionRate = conversionRate;
    this.variantText = variantText;
    this.limitText = limitText;
    this.updatedAt = updatedAt;
    this.summaryText = summaryText;
    this.journeyIdText = journeyIdText;
    this.title = title;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toMacroCycleView(item: MacroCycle): MacroCycleView {
  return new MacroCycleView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    item.variant,
    String(item.limit),
    String(item.updatedAt),
    item.summary,
    item.journeyId,
    item.title,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroCycleViews(items: MacroCycle[]): MacroCycleView[] {
  const views: MacroCycleView[] = [];
  for (const item of items) {
    views.push(toMacroCycleView(item));
  }
  return views;
}

export function sumMacroCycleView(view: MacroCycleView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedConversionRate + parsedLimit + parsedUpdatedAt;
}
