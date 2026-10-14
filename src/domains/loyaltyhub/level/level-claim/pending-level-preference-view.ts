import * as text from "../../../../kit/text.js";
import { PendingLevelPreference } from "./pending-level-preference.js";

/** How screens and exports show a pending level preference. */
export class PendingLevelPreferenceView {
  code: string;
  nameText: string;
  channel: string;
  endsAt: string;
  journeyId: string;
  discountText: string;
  batchSize: string;
  limitText: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    channel: string,
    endsAt: string,
    journeyId: string,
    discountText: string,
    batchSize: string,
    limitText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.channel = channel;
    this.endsAt = endsAt;
    this.journeyId = journeyId;
    this.discountText = discountText;
    this.batchSize = batchSize;
    this.limitText = limitText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toPendingLevelPreferenceView(item: PendingLevelPreference): PendingLevelPreferenceView {
  return new PendingLevelPreferenceView(
    item.code,
    item.name,
    item.channel,
    String(item.endsAt),
    text.truncate(item.journeyId, 40),
    item.discount.toFixed(2),
    String(item.batchSize),
    String(item.limit),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingLevelPreferenceViews(items: PendingLevelPreference[]): PendingLevelPreferenceView[] {
  const views: PendingLevelPreferenceView[] = [];
  for (const item of items) {
    views.push(toPendingLevelPreferenceView(item));
  }
  return views;
}

export function sumPendingLevelPreferenceView(view: PendingLevelPreferenceView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedEndsAt + parsedDiscount + parsedBatchSize;
}
