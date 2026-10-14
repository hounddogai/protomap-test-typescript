import { LegacyRewardRuleLedger } from "./legacy-reward-rule-ledger.js";

/** How screens and exports show a legacy reward rule ledger. */
export class LegacyRewardRuleLedgerView {
  code: string;
  titleText: string;
  approvedText: string;
  visible: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    approvedText: string,
    visible: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.approvedText = approvedText;
    this.visible = visible;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRewardRuleLedgerView(item: LegacyRewardRuleLedger): LegacyRewardRuleLedgerView {
  return new LegacyRewardRuleLedgerView(
    item.code,
    item.title,
    `${item.approved}`,
    `${item.visible}`,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRewardRuleLedgerViews(items: LegacyRewardRuleLedger[]): LegacyRewardRuleLedgerView[] {
  const views: LegacyRewardRuleLedgerView[] = [];
  for (const item of items) {
    views.push(toLegacyRewardRuleLedgerView(item));
  }
  return views;
}

export function sumLegacyRewardRuleLedgerView(view: LegacyRewardRuleLedgerView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
