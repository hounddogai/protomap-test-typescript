import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionScore } from "./fallback-subscription-score.js";

/** How screens and exports show a fallback subscription score. */
export class FallbackSubscriptionScoreView {
  code: string;
  labelText: string;
  externalRefText: string;
  priorityText: string;
  ceiling: string;
  contactEmail: string;
  ratio: string;
  ownerId: string;
  channel: string;
  visible: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    externalRefText: string,
    priorityText: string,
    ceiling: string,
    contactEmail: string,
    ratio: string,
    ownerId: string,
    channel: string,
    visible: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.externalRefText = externalRefText;
    this.priorityText = priorityText;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.channel = channel;
    this.visible = visible;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSubscriptionScoreView(item: FallbackSubscriptionScore): FallbackSubscriptionScoreView {
  return new FallbackSubscriptionScoreView(
    item.code,
    item.label,
    item.externalRef,
    String(item.priority),
    item.ceiling.toFixed(2),
    text.truncate(item.contactEmail, 80),
    item.ratio.toFixed(2),
    text.truncate(item.ownerId, 120),
    text.truncate(item.channel, 120),
    `${item.visible}`,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSubscriptionScoreViews(items: FallbackSubscriptionScore[]): FallbackSubscriptionScoreView[] {
  const views: FallbackSubscriptionScoreView[] = [];
  for (const item of items) {
    views.push(toFallbackSubscriptionScoreView(item));
  }
  return views;
}

export function sumFallbackSubscriptionScoreView(view: FallbackSubscriptionScoreView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedPriority + parsedCeiling + parsedRatio;
}
