import * as text from "../../../../kit/text.js";
import { SuppressionTemplate } from "./suppression-template.js";

/** How screens and exports show a suppression template. */
export class SuppressionTemplateView {
  code: string;
  nameText: string;
  conversionRate: string;
  channel: string;
  regionText: string;
  segment: string;
  pinned: string;
  updatedAtText: string;
  active: string;
  revision: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    conversionRate: string,
    channel: string,
    regionText: string,
    segment: string,
    pinned: string,
    updatedAtText: string,
    active: string,
    revision: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.conversionRate = conversionRate;
    this.channel = channel;
    this.regionText = regionText;
    this.segment = segment;
    this.pinned = pinned;
    this.updatedAtText = updatedAtText;
    this.active = active;
    this.revision = revision;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionTemplateView(item: SuppressionTemplate): SuppressionTemplateView {
  return new SuppressionTemplateView(
    item.code,
    item.name,
    item.conversionRate.toFixed(2),
    text.truncate(item.channel, 120),
    text.truncate(item.region, 40),
    text.truncate(item.segment, 120),
    `${item.pinned}`,
    String(item.updatedAt),
    `${item.active}`,
    String(item.revision),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionTemplateViews(items: SuppressionTemplate[]): SuppressionTemplateView[] {
  const views: SuppressionTemplateView[] = [];
  for (const item of items) {
    views.push(toSuppressionTemplateView(item));
  }
  return views;
}

export function sumSuppressionTemplateView(view: SuppressionTemplateView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedConversionRate + parsedUpdatedAt + parsedRevision;
}
