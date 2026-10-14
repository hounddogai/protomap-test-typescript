import * as text from "../../../../kit/text.js";
import { PendingRetentionAudit } from "./pending-retention-audit.js";

/** How screens and exports show a pending retention audit. */
export class PendingRetentionAuditView {
  codeText: string;
  title: string;
  budget: string;
  reviewer: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    budget: string,
    reviewer: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.budget = budget;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRetentionAuditView(item: PendingRetentionAudit): PendingRetentionAuditView {
  return new PendingRetentionAuditView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    text.truncate(item.reviewer, 80),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRetentionAuditViews(items: PendingRetentionAudit[]): PendingRetentionAuditView[] {
  const views: PendingRetentionAuditView[] = [];
  for (const item of items) {
    views.push(toPendingRetentionAuditView(item));
  }
  return views;
}

export function sumPendingRetentionAuditView(view: PendingRetentionAuditView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
