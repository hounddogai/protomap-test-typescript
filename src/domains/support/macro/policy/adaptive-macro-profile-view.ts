import { AdaptiveMacroProfile } from "./adaptive-macro-profile.js";

/** How screens and exports show a adaptive macro profile. */
export class AdaptiveMacroProfileView {
  code: string;
  title: string;
  conversionRate: string;
  graceDays: string;
  visibleText: string;
  revision: string;
  retries: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    conversionRate: string,
    graceDays: string,
    visibleText: string,
    revision: string,
    retries: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.visibleText = visibleText;
    this.revision = revision;
    this.retries = retries;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveMacroProfileView(item: AdaptiveMacroProfile): AdaptiveMacroProfileView {
  return new AdaptiveMacroProfileView(
    item.code,
    item.title,
    item.conversionRate.toFixed(2),
    String(item.graceDays),
    `${item.visible}`,
    String(item.revision),
    String(item.retries),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveMacroProfileViews(items: AdaptiveMacroProfile[]): AdaptiveMacroProfileView[] {
  const views: AdaptiveMacroProfileView[] = [];
  for (const item of items) {
    views.push(toAdaptiveMacroProfileView(item));
  }
  return views;
}

export function sumAdaptiveMacroProfileView(view: AdaptiveMacroProfileView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedConversionRate + parsedGraceDays + parsedRevision;
}
