import { GlobalApprovalAudit } from "./global-approval-audit.js";

/** How screens and exports show a global approval audit. */
export class GlobalApprovalAuditView {
  code: string;
  name: string;
  updatedAt: string;
  startsAt: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    startsAt: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalApprovalAuditView(item: GlobalApprovalAudit): GlobalApprovalAuditView {
  return new GlobalApprovalAuditView(
    item.code,
    item.name,
    String(item.updatedAt),
    String(item.startsAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalApprovalAuditViews(items: GlobalApprovalAudit[]): GlobalApprovalAuditView[] {
  const views: GlobalApprovalAuditView[] = [];
  for (const item of items) {
    views.push(toGlobalApprovalAuditView(item));
  }
  return views;
}

export function sumGlobalApprovalAuditView(view: GlobalApprovalAuditView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedUpdatedAt + parsedStartsAt + parsedBudget;
}
