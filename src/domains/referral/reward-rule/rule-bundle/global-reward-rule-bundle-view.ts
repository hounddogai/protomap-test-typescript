import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleBundle } from "./global-reward-rule-bundle.js";

/** How screens and exports show a global reward rule bundle. */
export class GlobalRewardRuleBundleView {
  code: string;
  name: string;
  floorValue: string;
  unitText: string;
  sendAtText: string;
  updatedAt: string;
  ownerId: string;
  discount: string;
  versionText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    unitText: string,
    sendAtText: string,
    updatedAt: string,
    ownerId: string,
    discount: string,
    versionText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.unitText = unitText;
    this.sendAtText = sendAtText;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
    this.discount = discount;
    this.versionText = versionText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRewardRuleBundleView(item: GlobalRewardRuleBundle): GlobalRewardRuleBundleView {
  return new GlobalRewardRuleBundleView(
    item.code,
    text.truncate(item.name, 120),
    item.floorValue.toFixed(2),
    text.truncate(item.unit, 80),
    String(item.sendAt),
    String(item.updatedAt),
    item.ownerId,
    item.discount.toFixed(2),
    String(item.version),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRewardRuleBundleViews(items: GlobalRewardRuleBundle[]): GlobalRewardRuleBundleView[] {
  const views: GlobalRewardRuleBundleView[] = [];
  for (const item of items) {
    views.push(toGlobalRewardRuleBundleView(item));
  }
  return views;
}

export function sumGlobalRewardRuleBundleView(view: GlobalRewardRuleBundleView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedFloorValue + parsedSendAt + parsedUpdatedAt;
}
