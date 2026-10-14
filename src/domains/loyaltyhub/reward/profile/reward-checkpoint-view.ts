import * as text from "../../../../kit/text.js";
import { RewardCheckpoint } from "./reward-checkpoint.js";

/** How screens and exports show a reward checkpoint. */
export class RewardCheckpointView {
  code: string;
  nameText: string;
  endsAt: string;
  campaignRef: string;
  journeyId: string;
  checksum: string;
  country: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    endsAt: string,
    campaignRef: string,
    journeyId: string,
    checksum: string,
    country: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.checksum = checksum;
    this.country = country;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardCheckpointView(item: RewardCheckpoint): RewardCheckpointView {
  return new RewardCheckpointView(
    item.code,
    item.name,
    String(item.endsAt),
    item.campaignRef,
    item.journeyId,
    item.checksum,
    item.country,
    text.truncate(item.locale, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardCheckpointViews(items: RewardCheckpoint[]): RewardCheckpointView[] {
  const views: RewardCheckpointView[] = [];
  for (const item of items) {
    views.push(toRewardCheckpointView(item));
  }
  return views;
}

export function sumRewardCheckpointView(view: RewardCheckpointView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedEndsAt;
}
