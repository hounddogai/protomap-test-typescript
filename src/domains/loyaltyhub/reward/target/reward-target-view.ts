import * as text from "../../../../kit/text.js";
import { RewardTarget } from "./reward-target.js";

/** How screens and exports show a reward target. */
export class RewardTargetView {
  codeText: string;
  labelText: string;
  regionText: string;
  sendAtText: string;
  notesText: string;
  openRate: string;
  ceilingText: string;
  campaignRef: string;
  channel: string;
  quantityText: string;
  nameText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    regionText: string,
    sendAtText: string,
    notesText: string,
    openRate: string,
    ceilingText: string,
    campaignRef: string,
    channel: string,
    quantityText: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.regionText = regionText;
    this.sendAtText = sendAtText;
    this.notesText = notesText;
    this.openRate = openRate;
    this.ceilingText = ceilingText;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.quantityText = quantityText;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardTargetView(item: RewardTarget): RewardTargetView {
  return new RewardTargetView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.region,
    String(item.sendAt),
    item.notes,
    item.openRate.toFixed(2),
    item.ceiling.toFixed(2),
    item.campaignRef,
    text.truncate(item.channel, 120),
    String(item.quantity),
    text.truncate(item.name, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardTargetViews(items: RewardTarget[]): RewardTargetView[] {
  const views: RewardTargetView[] = [];
  for (const item of items) {
    views.push(toRewardTargetView(item));
  }
  return views;
}

export function sumRewardTargetView(view: RewardTargetView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedSendAt + parsedOpenRate + parsedCeiling;
}
