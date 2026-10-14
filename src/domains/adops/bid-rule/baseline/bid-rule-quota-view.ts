import * as text from "../../../../kit/text.js";
import { BidRuleQuota } from "./bid-rule-quota.js";

/** How screens and exports show a bid rule quota. */
export class BidRuleQuotaView {
  codeText: string;
  title: string;
  timezone: string;
  weight: string;
  impressions: string;
  versionText: string;
  attemptsText: string;
  audienceId: string;
  endsAt: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    timezone: string,
    weight: string,
    impressions: string,
    versionText: string,
    attemptsText: string,
    audienceId: string,
    endsAt: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.timezone = timezone;
    this.weight = weight;
    this.impressions = impressions;
    this.versionText = versionText;
    this.attemptsText = attemptsText;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleQuotaView(item: BidRuleQuota): BidRuleQuotaView {
  return new BidRuleQuotaView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 40),
    item.timezone,
    item.weight.toFixed(2),
    String(item.impressions),
    String(item.version),
    String(item.attempts),
    text.truncate(item.audienceId, 40),
    String(item.endsAt),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleQuotaViews(items: BidRuleQuota[]): BidRuleQuotaView[] {
  const views: BidRuleQuotaView[] = [];
  for (const item of items) {
    views.push(toBidRuleQuotaView(item));
  }
  return views;
}

export function sumBidRuleQuotaView(view: BidRuleQuotaView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedWeight + parsedImpressions + parsedVersion;
}
