import * as text from "../../../../kit/text.js";
import { RewardPolicy } from "./reward-policy.js";

/** How screens and exports show a reward policy. */
export class RewardPolicyView {
  code: string;
  name: string;
  externalRef: string;
  createdAt: string;
  journeyIdText: string;
  rate: string;
  sendAt: string;
  title: string;
  visible: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    createdAt: string,
    journeyIdText: string,
    rate: string,
    sendAt: string,
    title: string,
    visible: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
    this.journeyIdText = journeyIdText;
    this.rate = rate;
    this.sendAt = sendAt;
    this.title = title;
    this.visible = visible;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardPolicyView(item: RewardPolicy): RewardPolicyView {
  return new RewardPolicyView(
    item.code,
    text.truncate(item.name, 80),
    item.externalRef,
    String(item.createdAt),
    text.truncate(item.journeyId, 40),
    item.rate.toFixed(2),
    String(item.sendAt),
    item.title,
    `${item.visible}`,
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardPolicyViews(items: RewardPolicy[]): RewardPolicyView[] {
  const views: RewardPolicyView[] = [];
  for (const item of items) {
    views.push(toRewardPolicyView(item));
  }
  return views;
}

export function sumRewardPolicyView(view: RewardPolicyView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCreatedAt + parsedRate + parsedSendAt;
}
