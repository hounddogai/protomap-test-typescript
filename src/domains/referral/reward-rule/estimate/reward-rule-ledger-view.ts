import * as text from "../../../../kit/text.js";
import { RewardRuleLedger } from "./reward-rule-ledger.js";

/** How screens and exports show a reward rule ledger. */
export class RewardRuleLedgerView {
  codeText: string;
  name: string;
  discount: string;
  cohortText: string;
  region: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    discount: string,
    cohortText: string,
    region: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.discount = discount;
    this.cohortText = cohortText;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleLedgerView(item: RewardRuleLedger): RewardRuleLedgerView {
  return new RewardRuleLedgerView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    item.discount.toFixed(2),
    item.cohort,
    text.truncate(item.region, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleLedgerViews(items: RewardRuleLedger[]): RewardRuleLedgerView[] {
  const views: RewardRuleLedgerView[] = [];
  for (const item of items) {
    views.push(toRewardRuleLedgerView(item));
  }
  return views;
}

export function sumRewardRuleLedgerView(view: RewardRuleLedgerView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
