import { LenientApprovalPlan } from "./lenient-approval-plan.js";

/** How screens and exports show a lenient approval plan. */
export class LenientApprovalPlanView {
  codeText: string;
  name: string;
  threshold: string;
  versionText: string;
  sendAt: string;
  segmentText: string;
  ratio: string;
  createdAt: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    threshold: string,
    versionText: string,
    sendAt: string,
    segmentText: string,
    ratio: string,
    createdAt: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.threshold = threshold;
    this.versionText = versionText;
    this.sendAt = sendAt;
    this.segmentText = segmentText;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLenientApprovalPlanView(item: LenientApprovalPlan): LenientApprovalPlanView {
  return new LenientApprovalPlanView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    String(item.version),
    String(item.sendAt),
    item.segment,
    item.ratio.toFixed(2),
    String(item.createdAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientApprovalPlanViews(items: LenientApprovalPlan[]): LenientApprovalPlanView[] {
  const views: LenientApprovalPlanView[] = [];
  for (const item of items) {
    views.push(toLenientApprovalPlanView(item));
  }
  return views;
}

export function sumLenientApprovalPlanView(view: LenientApprovalPlanView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedThreshold + parsedVersion + parsedSendAt;
}
