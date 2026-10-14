import * as text from "../../../../kit/text.js";
import { ManualExitRuleMilestone } from "./manual-exit-rule-milestone.js";

/** How screens and exports show a manual exit rule milestone. */
export class ManualExitRuleMilestoneView {
  codeText: string;
  name: string;
  utmSource: string;
  weight: string;
  campaignRefText: string;
  endsAt: string;
  channel: string;
  expiresAt: string;
  minimum: string;
  maximum: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    utmSource: string,
    weight: string,
    campaignRefText: string,
    endsAt: string,
    channel: string,
    expiresAt: string,
    minimum: string,
    maximum: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.utmSource = utmSource;
    this.weight = weight;
    this.campaignRefText = campaignRefText;
    this.endsAt = endsAt;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.minimum = minimum;
    this.maximum = maximum;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toManualExitRuleMilestoneView(item: ManualExitRuleMilestone): ManualExitRuleMilestoneView {
  return new ManualExitRuleMilestoneView(
    item.code,
    item.name,
    item.utmSource,
    item.weight.toFixed(2),
    item.campaignRef,
    String(item.endsAt),
    text.truncate(item.channel, 120),
    String(item.expiresAt),
    item.minimum.toFixed(2),
    item.maximum.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualExitRuleMilestoneViews(items: ManualExitRuleMilestone[]): ManualExitRuleMilestoneView[] {
  const views: ManualExitRuleMilestoneView[] = [];
  for (const item of items) {
    views.push(toManualExitRuleMilestoneView(item));
  }
  return views;
}

export function sumManualExitRuleMilestoneView(view: ManualExitRuleMilestoneView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedWeight + parsedEndsAt + parsedExpiresAt;
}
