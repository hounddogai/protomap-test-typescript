import * as text from "../../../../kit/text.js";
import { RewardRuleVariance } from "./reward-rule-variance.js";

/** How screens and exports show a reward rule variance. */
export class RewardRuleVarianceView {
  codeText: string;
  titleText: string;
  approvedText: string;
  revision: string;
  discount: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    approvedText: string,
    revision: string,
    discount: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.approvedText = approvedText;
    this.revision = revision;
    this.discount = discount;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleVarianceView(item: RewardRuleVariance): RewardRuleVarianceView {
  return new RewardRuleVarianceView(
    item.code,
    text.truncate(item.title, 40),
    `${item.approved}`,
    String(item.revision),
    item.discount.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleVarianceViews(items: RewardRuleVariance[]): RewardRuleVarianceView[] {
  const views: RewardRuleVarianceView[] = [];
  for (const item of items) {
    views.push(toRewardRuleVarianceView(item));
  }
  return views;
}

export function sumRewardRuleVarianceView(view: RewardRuleVarianceView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedRevision + parsedDiscount + parsedCreatedAt;
}
