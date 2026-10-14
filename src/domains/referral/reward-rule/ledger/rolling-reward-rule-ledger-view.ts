import * as text from "../../../../kit/text.js";
import { RollingRewardRuleLedger } from "./rolling-reward-rule-ledger.js";

/** How screens and exports show a rolling reward rule ledger. */
export class RollingRewardRuleLedgerView {
  codeText: string;
  label: string;
  active: string;
  sourceText: string;
  openRate: string;
  capacity: string;
  updatedAtText: string;
  journeyId: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    active: string,
    sourceText: string,
    openRate: string,
    capacity: string,
    updatedAtText: string,
    journeyId: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.active = active;
    this.sourceText = sourceText;
    this.openRate = openRate;
    this.capacity = capacity;
    this.updatedAtText = updatedAtText;
    this.journeyId = journeyId;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toRollingRewardRuleLedgerView(item: RollingRewardRuleLedger): RollingRewardRuleLedgerView {
  return new RollingRewardRuleLedgerView(
    item.code,
    text.truncate(item.label, 40),
    `${item.active}`,
    text.truncate(item.source, 80),
    item.openRate.toFixed(2),
    String(item.capacity),
    String(item.updatedAt),
    item.journeyId,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingRewardRuleLedgerViews(items: RollingRewardRuleLedger[]): RollingRewardRuleLedgerView[] {
  const views: RollingRewardRuleLedgerView[] = [];
  for (const item of items) {
    views.push(toRollingRewardRuleLedgerView(item));
  }
  return views;
}

export function sumRollingRewardRuleLedgerView(view: RollingRewardRuleLedgerView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedOpenRate + parsedCapacity + parsedUpdatedAt;
}
