import * as text from "../../../../kit/text.js";
import { RedemptionRollup } from "./redemption-rollup.js";

/** How screens and exports show a redemption rollup. */
export class RedemptionRollupView {
  code: string;
  label: string;
  contactEmail: string;
  costText: string;
  startsAt: string;
  utmSource: string;
  journeyId: string;
  pinned: string;
  endsAt: string;
  ownerId: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    costText: string,
    startsAt: string,
    utmSource: string,
    journeyId: string,
    pinned: string,
    endsAt: string,
    ownerId: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.costText = costText;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionRollupView(item: RedemptionRollup): RedemptionRollupView {
  return new RedemptionRollupView(
    item.code,
    text.truncate(item.label, 64),
    text.truncate(item.contactEmail, 120),
    item.cost.toFixed(2),
    String(item.startsAt),
    item.utmSource,
    item.journeyId,
    `${item.pinned}`,
    String(item.endsAt),
    item.ownerId,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionRollupViews(items: RedemptionRollup[]): RedemptionRollupView[] {
  const views: RedemptionRollupView[] = [];
  for (const item of items) {
    views.push(toRedemptionRollupView(item));
  }
  return views;
}

export function sumRedemptionRollupView(view: RedemptionRollupView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCost + parsedStartsAt + parsedEndsAt;
}
