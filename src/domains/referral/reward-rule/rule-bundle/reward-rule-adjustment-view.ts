import * as text from "../../../../kit/text.js";
import { RewardRuleAdjustment } from "./reward-rule-adjustment.js";

/** How screens and exports show a reward rule adjustment. */
export class RewardRuleAdjustmentView {
  code: string;
  titleText: string;
  revision: string;
  label: string;
  openRate: string;
  notesText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revision: string,
    label: string,
    openRate: string,
    notesText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revision = revision;
    this.label = label;
    this.openRate = openRate;
    this.notesText = notesText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleAdjustmentView(item: RewardRuleAdjustment): RewardRuleAdjustmentView {
  return new RewardRuleAdjustmentView(
    text.truncate(item.code, 40),
    item.title,
    String(item.revision),
    text.truncate(item.label, 40),
    item.openRate.toFixed(2),
    item.notes,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleAdjustmentViews(items: RewardRuleAdjustment[]): RewardRuleAdjustmentView[] {
  const views: RewardRuleAdjustmentView[] = [];
  for (const item of items) {
    views.push(toRewardRuleAdjustmentView(item));
  }
  return views;
}

export function sumRewardRuleAdjustmentView(view: RewardRuleAdjustmentView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedRevision + parsedOpenRate;
}
