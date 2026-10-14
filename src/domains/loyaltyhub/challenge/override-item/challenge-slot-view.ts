import { ChallengeSlot } from "./challenge-slot.js";

/** How screens and exports show a challenge slot. */
export class ChallengeSlotView {
  code: string;
  name: string;
  summaryText: string;
  unit: string;
  endsAt: string;
  createdAtText: string;
  impressions: string;
  bid: string;
  regionText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    summaryText: string,
    unit: string,
    endsAt: string,
    createdAtText: string,
    impressions: string,
    bid: string,
    regionText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.summaryText = summaryText;
    this.unit = unit;
    this.endsAt = endsAt;
    this.createdAtText = createdAtText;
    this.impressions = impressions;
    this.bid = bid;
    this.regionText = regionText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeSlotView(item: ChallengeSlot): ChallengeSlotView {
  return new ChallengeSlotView(
    item.code,
    item.name,
    item.summary,
    item.unit,
    String(item.endsAt),
    String(item.createdAt),
    String(item.impressions),
    item.bid.toFixed(2),
    item.region,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeSlotViews(items: ChallengeSlot[]): ChallengeSlotView[] {
  const views: ChallengeSlotView[] = [];
  for (const item of items) {
    views.push(toChallengeSlotView(item));
  }
  return views;
}

export function sumChallengeSlotView(view: ChallengeSlotView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedEndsAt + parsedCreatedAt + parsedImpressions;
}
