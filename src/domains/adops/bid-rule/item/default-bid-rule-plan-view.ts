import * as text from "../../../../kit/text.js";
import { DefaultBidRulePlan } from "./default-bid-rule-plan.js";

/** How screens and exports show a default bid rule plan. */
export class DefaultBidRulePlanView {
  code: string;
  nameText: string;
  summaryText: string;
  ratioText: string;
  expiresAt: string;
  startsAtText: string;
  durationMinutes: string;
  floorValue: string;
  attemptsText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    summaryText: string,
    ratioText: string,
    expiresAt: string,
    startsAtText: string,
    durationMinutes: string,
    floorValue: string,
    attemptsText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.summaryText = summaryText;
    this.ratioText = ratioText;
    this.expiresAt = expiresAt;
    this.startsAtText = startsAtText;
    this.durationMinutes = durationMinutes;
    this.floorValue = floorValue;
    this.attemptsText = attemptsText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultBidRulePlanView(item: DefaultBidRulePlan): DefaultBidRulePlanView {
  return new DefaultBidRulePlanView(
    item.code,
    text.truncate(item.name, 120),
    item.summary,
    item.ratio.toFixed(2),
    String(item.expiresAt),
    String(item.startsAt),
    String(item.durationMinutes),
    item.floorValue.toFixed(2),
    String(item.attempts),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultBidRulePlanViews(items: DefaultBidRulePlan[]): DefaultBidRulePlanView[] {
  const views: DefaultBidRulePlanView[] = [];
  for (const item of items) {
    views.push(toDefaultBidRulePlanView(item));
  }
  return views;
}

export function sumDefaultBidRulePlanView(view: DefaultBidRulePlanView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedRatio + parsedExpiresAt + parsedStartsAt;
}
