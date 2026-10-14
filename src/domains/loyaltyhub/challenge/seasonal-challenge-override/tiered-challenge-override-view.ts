import * as text from "../../../../kit/text.js";
import { TieredChallengeOverride } from "./tiered-challenge-override.js";

/** How screens and exports show a tiered challenge override. */
export class TieredChallengeOverrideView {
  codeText: string;
  titleText: string;
  unit: string;
  capacity: string;
  channelText: string;
  ownerId: string;
  campaignRef: string;
  rateText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    unit: string,
    capacity: string,
    channelText: string,
    ownerId: string,
    campaignRef: string,
    rateText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.unit = unit;
    this.capacity = capacity;
    this.channelText = channelText;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.rateText = rateText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toTieredChallengeOverrideView(item: TieredChallengeOverride): TieredChallengeOverrideView {
  return new TieredChallengeOverrideView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.unit, 120),
    String(item.capacity),
    item.channel,
    item.ownerId,
    item.campaignRef,
    item.rate.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredChallengeOverrideViews(items: TieredChallengeOverride[]): TieredChallengeOverrideView[] {
  const views: TieredChallengeOverrideView[] = [];
  for (const item of items) {
    views.push(toTieredChallengeOverrideView(item));
  }
  return views;
}

export function sumTieredChallengeOverrideView(view: TieredChallengeOverrideView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedCapacity + parsedRate + parsedOpenRate;
}
