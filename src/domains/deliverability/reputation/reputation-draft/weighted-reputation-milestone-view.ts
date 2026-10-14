import { WeightedReputationMilestone } from "./weighted-reputation-milestone.js";

/** How screens and exports show a weighted reputation milestone. */
export class WeightedReputationMilestoneView {
  code: string;
  nameText: string;
  country: string;
  limitText: string;
  endsAt: string;
  regionText: string;
  sendAtText: string;
  weightText: string;
  updatedAt: string;
  startsAt: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    country: string,
    limitText: string,
    endsAt: string,
    regionText: string,
    sendAtText: string,
    weightText: string,
    updatedAt: string,
    startsAt: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.country = country;
    this.limitText = limitText;
    this.endsAt = endsAt;
    this.regionText = regionText;
    this.sendAtText = sendAtText;
    this.weightText = weightText;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReputationMilestoneView(item: WeightedReputationMilestone): WeightedReputationMilestoneView {
  return new WeightedReputationMilestoneView(
    item.code,
    item.name,
    item.country,
    String(item.limit),
    String(item.endsAt),
    item.region,
    String(item.sendAt),
    item.weight.toFixed(2),
    String(item.updatedAt),
    String(item.startsAt),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReputationMilestoneViews(items: WeightedReputationMilestone[]): WeightedReputationMilestoneView[] {
  const views: WeightedReputationMilestoneView[] = [];
  for (const item of items) {
    views.push(toWeightedReputationMilestoneView(item));
  }
  return views;
}

export function sumWeightedReputationMilestoneView(view: WeightedReputationMilestoneView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedLimit + parsedEndsAt + parsedSendAt;
}
