import * as text from "../../../../kit/text.js";
import { LegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

/** How screens and exports show a legacy subscription milestone. */
export class LegacySubscriptionMilestoneView {
  code: string;
  title: string;
  impressions: string;
  rateText: string;
  createdAtText: string;
  contactEmail: string;
  source: string;
  costText: string;
  revision: string;
  sequence: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    impressions: string,
    rateText: string,
    createdAtText: string,
    contactEmail: string,
    source: string,
    costText: string,
    revision: string,
    sequence: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.rateText = rateText;
    this.createdAtText = createdAtText;
    this.contactEmail = contactEmail;
    this.source = source;
    this.costText = costText;
    this.revision = revision;
    this.sequence = sequence;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySubscriptionMilestoneView(item: LegacySubscriptionMilestone): LegacySubscriptionMilestoneView {
  return new LegacySubscriptionMilestoneView(
    text.truncate(item.code, 120),
    item.title,
    String(item.impressions),
    item.rate.toFixed(2),
    String(item.createdAt),
    text.truncate(item.contactEmail, 40),
    item.source,
    item.cost.toFixed(2),
    String(item.revision),
    String(item.sequence),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySubscriptionMilestoneViews(items: LegacySubscriptionMilestone[]): LegacySubscriptionMilestoneView[] {
  const views: LegacySubscriptionMilestoneView[] = [];
  for (const item of items) {
    views.push(toLegacySubscriptionMilestoneView(item));
  }
  return views;
}

export function sumLegacySubscriptionMilestoneView(view: LegacySubscriptionMilestoneView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedImpressions + parsedRate + parsedCreatedAt;
}
