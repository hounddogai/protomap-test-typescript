import * as text from "../../../../kit/text.js";
import { RollingEscalationMapping } from "./rolling-escalation-mapping.js";

/** How screens and exports show a rolling escalation mapping. */
export class RollingEscalationMappingView {
  codeText: string;
  labelText: string;
  openRateText: string;
  active: string;
  budget: string;
  limitText: string;
  approvedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    openRateText: string,
    active: string,
    budget: string,
    limitText: string,
    approvedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.openRateText = openRateText;
    this.active = active;
    this.budget = budget;
    this.limitText = limitText;
    this.approvedText = approvedText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingEscalationMappingView(item: RollingEscalationMapping): RollingEscalationMappingView {
  return new RollingEscalationMappingView(
    item.code,
    text.truncate(item.label, 40),
    item.openRate.toFixed(2),
    `${item.active}`,
    item.budget.toFixed(2),
    String(item.limit),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingEscalationMappingViews(items: RollingEscalationMapping[]): RollingEscalationMappingView[] {
  const views: RollingEscalationMappingView[] = [];
  for (const item of items) {
    views.push(toRollingEscalationMappingView(item));
  }
  return views;
}

export function sumRollingEscalationMappingView(view: RollingEscalationMappingView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedOpenRate + parsedBudget + parsedLimit;
}
