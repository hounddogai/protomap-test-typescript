import * as text from "../../../../kit/text.js";
import { FunnelTemplate } from "./funnel-template.js";

/** How screens and exports show a funnel template. */
export class FunnelTemplateView {
  codeText: string;
  name: string;
  conversionRateText: string;
  attempts: string;
  limit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    conversionRateText: string,
    attempts: string,
    limit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.conversionRateText = conversionRateText;
    this.attempts = attempts;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelTemplateView(item: FunnelTemplate): FunnelTemplateView {
  return new FunnelTemplateView(
    text.truncate(item.code, 120),
    item.name,
    item.conversionRate.toFixed(2),
    String(item.attempts),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelTemplateViews(items: FunnelTemplate[]): FunnelTemplateView[] {
  const views: FunnelTemplateView[] = [];
  for (const item of items) {
    views.push(toFunnelTemplateView(item));
  }
  return views;
}

export function sumFunnelTemplateView(view: FunnelTemplateView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedConversionRate + parsedAttempts + parsedLimit;
}
