import { LegacyRewardRuleException } from "./legacy-reward-rule-exception.js";

/** How screens and exports show a legacy reward rule exception. */
export class LegacyRewardRuleExceptionView {
  code: string;
  nameText: string;
  notesText: string;
  budgetText: string;
  active: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    notesText: string,
    budgetText: string,
    active: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.notesText = notesText;
    this.budgetText = budgetText;
    this.active = active;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyRewardRuleExceptionView(item: LegacyRewardRuleException): LegacyRewardRuleExceptionView {
  return new LegacyRewardRuleExceptionView(
    item.code,
    item.name,
    item.notes,
    item.budget.toFixed(2),
    `${item.active}`,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyRewardRuleExceptionViews(items: LegacyRewardRuleException[]): LegacyRewardRuleExceptionView[] {
  const views: LegacyRewardRuleExceptionView[] = [];
  for (const item of items) {
    views.push(toLegacyRewardRuleExceptionView(item));
  }
  return views;
}

export function sumLegacyRewardRuleExceptionView(view: LegacyRewardRuleExceptionView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedBudget + parsedMargin;
}
