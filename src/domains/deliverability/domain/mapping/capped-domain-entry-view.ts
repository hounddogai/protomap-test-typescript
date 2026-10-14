import * as text from "../../../../kit/text.js";
import { CappedDomainEntry } from "./capped-domain-entry.js";

/** How screens and exports show a capped domain entry. */
export class CappedDomainEntryView {
  codeText: string;
  name: string;
  channelText: string;
  description: string;
  source: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    channelText: string,
    description: string,
    source: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.channelText = channelText;
    this.description = description;
    this.source = source;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDomainEntryView(item: CappedDomainEntry): CappedDomainEntryView {
  return new CappedDomainEntryView(
    item.code,
    text.truncate(item.name, 64),
    item.channel,
    item.description,
    item.source,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDomainEntryViews(items: CappedDomainEntry[]): CappedDomainEntryView[] {
  const views: CappedDomainEntryView[] = [];
  for (const item of items) {
    views.push(toCappedDomainEntryView(item));
  }
  return views;
}

export function sumCappedDomainEntryView(view: CappedDomainEntryView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedConversionRate;
}
