import { RegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

/** How screens and exports show a regional reward rule ledger. */
export class RegionalRewardRuleLedgerView {
  code: string;
  labelText: string;
  cohort: string;
  pinned: string;
  ownerId: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    cohort: string,
    pinned: string,
    ownerId: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.cohort = cohort;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRewardRuleLedgerView(item: RegionalRewardRuleLedger): RegionalRewardRuleLedgerView {
  return new RegionalRewardRuleLedgerView(
    item.code,
    item.label,
    item.cohort,
    `${item.pinned}`,
    item.ownerId,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRewardRuleLedgerViews(items: RegionalRewardRuleLedger[]): RegionalRewardRuleLedgerView[] {
  const views: RegionalRewardRuleLedgerView[] = [];
  for (const item of items) {
    views.push(toRegionalRewardRuleLedgerView(item));
  }
  return views;
}

export function sumRegionalRewardRuleLedgerView(view: RegionalRewardRuleLedgerView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
