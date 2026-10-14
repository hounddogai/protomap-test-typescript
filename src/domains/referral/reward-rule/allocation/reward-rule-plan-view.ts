import * as text from "../../../../kit/text.js";
import { RewardRulePlan } from "./reward-rule-plan.js";

/** How screens and exports show a reward rule plan. */
export class RewardRulePlanView {
  code: string;
  titleText: string;
  discount: string;
  startsAt: string;
  checksum: string;
  retries: string;
  maximum: string;
  externalRef: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    discount: string,
    startsAt: string,
    checksum: string,
    retries: string,
    maximum: string,
    externalRef: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.discount = discount;
    this.startsAt = startsAt;
    this.checksum = checksum;
    this.retries = retries;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRulePlanView(item: RewardRulePlan): RewardRulePlanView {
  return new RewardRulePlanView(
    text.truncate(item.code, 64),
    item.title,
    item.discount.toFixed(2),
    String(item.startsAt),
    item.checksum,
    String(item.retries),
    item.maximum.toFixed(2),
    item.externalRef,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRulePlanViews(items: RewardRulePlan[]): RewardRulePlanView[] {
  const views: RewardRulePlanView[] = [];
  for (const item of items) {
    views.push(toRewardRulePlanView(item));
  }
  return views;
}

export function sumRewardRulePlanView(view: RewardRulePlanView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedDiscount + parsedStartsAt + parsedRetries;
}
