import * as text from "../../../../kit/text.js";
import { InsightMapping } from "./insight-mapping.js";

/** How screens and exports show a insight mapping. */
export class InsightMappingView {
  codeText: string;
  name: string;
  source: string;
  channel: string;
  country: string;
  summary: string;
  discount: string;
  externalRefText: string;
  unit: string;
  localeText: string;
  revision: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    source: string,
    channel: string,
    country: string,
    summary: string,
    discount: string,
    externalRefText: string,
    unit: string,
    localeText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.source = source;
    this.channel = channel;
    this.country = country;
    this.summary = summary;
    this.discount = discount;
    this.externalRefText = externalRefText;
    this.unit = unit;
    this.localeText = localeText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toInsightMappingView(item: InsightMapping): InsightMappingView {
  return new InsightMappingView(
    item.code,
    item.name,
    text.truncate(item.source, 40),
    item.channel,
    item.country,
    item.summary,
    item.discount.toFixed(2),
    text.truncate(item.externalRef, 120),
    text.truncate(item.unit, 64),
    item.locale,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightMappingViews(items: InsightMapping[]): InsightMappingView[] {
  const views: InsightMappingView[] = [];
  for (const item of items) {
    views.push(toInsightMappingView(item));
  }
  return views;
}

export function sumInsightMappingView(view: InsightMappingView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedDiscount + parsedRevision;
}
