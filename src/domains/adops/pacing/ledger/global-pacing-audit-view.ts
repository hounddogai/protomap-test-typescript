import * as text from "../../../../kit/text.js";
import { GlobalPacingAudit } from "./global-pacing-audit.js";

/** How screens and exports show a global pacing audit. */
export class GlobalPacingAuditView {
  codeText: string;
  nameText: string;
  channel: string;
  budgetText: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    channel: string,
    budgetText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.channel = channel;
    this.budgetText = budgetText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPacingAuditView(item: GlobalPacingAudit): GlobalPacingAuditView {
  return new GlobalPacingAuditView(
    item.code,
    text.truncate(item.name, 120),
    item.channel,
    item.budget.toFixed(2),
    text.truncate(item.locale, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPacingAuditViews(items: GlobalPacingAudit[]): GlobalPacingAuditView[] {
  const views: GlobalPacingAuditView[] = [];
  for (const item of items) {
    views.push(toGlobalPacingAuditView(item));
  }
  return views;
}

export function sumGlobalPacingAuditView(view: GlobalPacingAuditView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedBudget;
}
