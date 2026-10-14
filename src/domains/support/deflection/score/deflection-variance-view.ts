import * as text from "../../../../kit/text.js";
import { DeflectionVariance } from "./deflection-variance.js";

/** How screens and exports show a deflection variance. */
export class DeflectionVarianceView {
  code: string;
  name: string;
  visible: string;
  attempts: string;
  summary: string;
  expiresAtText: string;
  conversionRate: string;
  locale: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    attempts: string,
    summary: string,
    expiresAtText: string,
    conversionRate: string,
    locale: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.attempts = attempts;
    this.summary = summary;
    this.expiresAtText = expiresAtText;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionVarianceView(item: DeflectionVariance): DeflectionVarianceView {
  return new DeflectionVarianceView(
    item.code,
    text.truncate(item.name, 80),
    `${item.visible}`,
    String(item.attempts),
    item.summary,
    String(item.expiresAt),
    item.conversionRate.toFixed(2),
    item.locale,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionVarianceViews(items: DeflectionVariance[]): DeflectionVarianceView[] {
  const views: DeflectionVarianceView[] = [];
  for (const item of items) {
    views.push(toDeflectionVarianceView(item));
  }
  return views;
}

export function sumDeflectionVarianceView(view: DeflectionVarianceView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAttempts + parsedExpiresAt + parsedConversionRate;
}
