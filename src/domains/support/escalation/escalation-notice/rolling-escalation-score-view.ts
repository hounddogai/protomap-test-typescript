import * as text from "../../../../kit/text.js";
import { RollingEscalationScore } from "./rolling-escalation-score.js";

/** How screens and exports show a rolling escalation score. */
export class RollingEscalationScoreView {
  codeText: string;
  nameText: string;
  timezone: string;
  endsAt: string;
  budgetText: string;
  variant: string;
  localeText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    timezone: string,
    endsAt: string,
    budgetText: string,
    variant: string,
    localeText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.budgetText = budgetText;
    this.variant = variant;
    this.localeText = localeText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toRollingEscalationScoreView(item: RollingEscalationScore): RollingEscalationScoreView {
  return new RollingEscalationScoreView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 80),
    item.timezone,
    String(item.endsAt),
    item.budget.toFixed(2),
    item.variant,
    item.locale,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingEscalationScoreViews(items: RollingEscalationScore[]): RollingEscalationScoreView[] {
  const views: RollingEscalationScoreView[] = [];
  for (const item of items) {
    views.push(toRollingEscalationScoreView(item));
  }
  return views;
}

export function sumRollingEscalationScoreView(view: RollingEscalationScoreView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedEndsAt + parsedBudget + parsedOpenRate;
}
