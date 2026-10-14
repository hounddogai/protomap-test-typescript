import * as text from "../../../../kit/text.js";
import { PrimaryMentionRule } from "./primary-mention-rule.js";

/** How screens and exports show a primary mention rule. */
export class PrimaryMentionRuleView {
  code: string;
  name: string;
  archived: string;
  locale: string;
  conversionRateText: string;
  segment: string;
  capacity: string;
  durationMinutes: string;
  audienceId: string;
  versionText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archived: string,
    locale: string,
    conversionRateText: string,
    segment: string,
    capacity: string,
    durationMinutes: string,
    audienceId: string,
    versionText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.locale = locale;
    this.conversionRateText = conversionRateText;
    this.segment = segment;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.versionText = versionText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryMentionRuleView(item: PrimaryMentionRule): PrimaryMentionRuleView {
  return new PrimaryMentionRuleView(
    item.code,
    item.name,
    `${item.archived}`,
    item.locale,
    item.conversionRate.toFixed(2),
    text.truncate(item.segment, 80),
    String(item.capacity),
    String(item.durationMinutes),
    text.truncate(item.audienceId, 80),
    String(item.version),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryMentionRuleViews(items: PrimaryMentionRule[]): PrimaryMentionRuleView[] {
  const views: PrimaryMentionRuleView[] = [];
  for (const item of items) {
    views.push(toPrimaryMentionRuleView(item));
  }
  return views;
}

export function sumPrimaryMentionRuleView(view: PrimaryMentionRuleView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedConversionRate + parsedCapacity + parsedDurationMinutes;
}
