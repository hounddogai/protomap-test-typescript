import * as text from "../../../../kit/text.js";
import { DomainTemplate } from "./domain-template.js";

/** How screens and exports show a domain template. */
export class DomainTemplateView {
  code: string;
  label: string;
  utmSourceText: string;
  description: string;
  clicksText: string;
  locale: string;
  sourceText: string;
  expiresAt: string;
  summary: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSourceText: string,
    description: string,
    clicksText: string,
    locale: string,
    sourceText: string,
    expiresAt: string,
    summary: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSourceText = utmSourceText;
    this.description = description;
    this.clicksText = clicksText;
    this.locale = locale;
    this.sourceText = sourceText;
    this.expiresAt = expiresAt;
    this.summary = summary;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainTemplateView(item: DomainTemplate): DomainTemplateView {
  return new DomainTemplateView(
    item.code,
    item.label,
    item.utmSource,
    text.truncate(item.description, 120),
    String(item.clicks),
    item.locale,
    item.source,
    String(item.expiresAt),
    text.truncate(item.summary, 64),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainTemplateViews(items: DomainTemplate[]): DomainTemplateView[] {
  const views: DomainTemplateView[] = [];
  for (const item of items) {
    views.push(toDomainTemplateView(item));
  }
  return views;
}

export function sumDomainTemplateView(view: DomainTemplateView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedClicks + parsedExpiresAt + parsedOpenRate;
}
