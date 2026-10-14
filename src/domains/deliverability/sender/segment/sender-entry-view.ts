import * as text from "../../../../kit/text.js";
import { SenderEntry } from "./sender-entry.js";

/** How screens and exports show a sender entry. */
export class SenderEntryView {
  code: string;
  labelText: string;
  channel: string;
  budget: string;
  ownerId: string;
  timezone: string;
  locale: string;
  version: string;
  conversionRate: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    budget: string,
    ownerId: string,
    timezone: string,
    locale: string,
    version: string,
    conversionRate: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.budget = budget;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.locale = locale;
    this.version = version;
    this.conversionRate = conversionRate;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toSenderEntryView(item: SenderEntry): SenderEntryView {
  return new SenderEntryView(
    item.code,
    text.truncate(item.label, 64),
    text.truncate(item.channel, 40),
    item.budget.toFixed(2),
    item.ownerId,
    text.truncate(item.timezone, 80),
    item.locale,
    String(item.version),
    item.conversionRate.toFixed(2),
    text.truncate(item.summary, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderEntryViews(items: SenderEntry[]): SenderEntryView[] {
  const views: SenderEntryView[] = [];
  for (const item of items) {
    views.push(toSenderEntryView(item));
  }
  return views;
}

export function sumSenderEntryView(view: SenderEntryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBudget + parsedVersion + parsedConversionRate;
}
