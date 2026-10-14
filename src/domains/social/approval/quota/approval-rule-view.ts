import { ApprovalRule } from "./approval-rule.js";

/** How screens and exports show a approval rule. */
export class ApprovalRuleView {
  codeText: string;
  title: string;
  revision: string;
  durationMinutes: string;
  ratio: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    revision: string,
    durationMinutes: string,
    ratio: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.revision = revision;
    this.durationMinutes = durationMinutes;
    this.ratio = ratio;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalRuleView(item: ApprovalRule): ApprovalRuleView {
  return new ApprovalRuleView(
    item.code,
    item.title,
    String(item.revision),
    String(item.durationMinutes),
    item.ratio.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalRuleViews(items: ApprovalRule[]): ApprovalRuleView[] {
  const views: ApprovalRuleView[] = [];
  for (const item of items) {
    views.push(toApprovalRuleView(item));
  }
  return views;
}

export function sumApprovalRuleView(view: ApprovalRuleView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRevision + parsedDurationMinutes + parsedRatio;
}
