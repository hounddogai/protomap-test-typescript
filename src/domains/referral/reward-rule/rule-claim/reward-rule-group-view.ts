import * as text from "../../../../kit/text.js";
import { RewardRuleGroup } from "./reward-rule-group.js";

/** How screens and exports show a reward rule group. */
export class RewardRuleGroupView {
  code: string;
  name: string;
  createdAt: string;
  localeText: string;
  archived: string;
  unitText: string;
  revisionText: string;
  discount: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAt: string,
    localeText: string,
    archived: string,
    unitText: string,
    revisionText: string,
    discount: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.localeText = localeText;
    this.archived = archived;
    this.unitText = unitText;
    this.revisionText = revisionText;
    this.discount = discount;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleGroupView(item: RewardRuleGroup): RewardRuleGroupView {
  return new RewardRuleGroupView(
    text.truncate(item.code, 80),
    item.name,
    String(item.createdAt),
    text.truncate(item.locale, 40),
    `${item.archived}`,
    item.unit,
    String(item.revision),
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleGroupViews(items: RewardRuleGroup[]): RewardRuleGroupView[] {
  const views: RewardRuleGroupView[] = [];
  for (const item of items) {
    views.push(toRewardRuleGroupView(item));
  }
  return views;
}

export function sumRewardRuleGroupView(view: RewardRuleGroupView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedCreatedAt + parsedRevision + parsedDiscount;
}
