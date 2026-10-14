import { CappedFunnelException } from "./capped-funnel-exception.js";

/** How screens and exports show a capped funnel exception. */
export class CappedFunnelExceptionView {
  code: string;
  label: string;
  approved: string;
  limit: string;
  descriptionText: string;
  budget: string;
  revision: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approved: string,
    limit: string,
    descriptionText: string,
    budget: string,
    revision: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.limit = limit;
    this.descriptionText = descriptionText;
    this.budget = budget;
    this.revision = revision;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFunnelExceptionView(item: CappedFunnelException): CappedFunnelExceptionView {
  return new CappedFunnelExceptionView(
    item.code,
    item.label,
    `${item.approved}`,
    String(item.limit),
    item.description,
    item.budget.toFixed(2),
    String(item.revision),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFunnelExceptionViews(items: CappedFunnelException[]): CappedFunnelExceptionView[] {
  const views: CappedFunnelExceptionView[] = [];
  for (const item of items) {
    views.push(toCappedFunnelExceptionView(item));
  }
  return views;
}

export function sumCappedFunnelExceptionView(view: CappedFunnelExceptionView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedLimit + parsedBudget + parsedRevision;
}
