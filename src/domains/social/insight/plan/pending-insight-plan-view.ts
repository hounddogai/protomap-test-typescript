import { PendingInsightPlan } from "./pending-insight-plan.js";

/** How screens and exports show a pending insight plan. */
export class PendingInsightPlanView {
  codeText: string;
  nameText: string;
  thresholdText: string;
  sequence: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    thresholdText: string,
    sequence: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.thresholdText = thresholdText;
    this.sequence = sequence;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toPendingInsightPlanView(item: PendingInsightPlan): PendingInsightPlanView {
  return new PendingInsightPlanView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    String(item.sequence),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingInsightPlanViews(items: PendingInsightPlan[]): PendingInsightPlanView[] {
  const views: PendingInsightPlanView[] = [];
  for (const item of items) {
    views.push(toPendingInsightPlanView(item));
  }
  return views;
}

export function sumPendingInsightPlanView(view: PendingInsightPlanView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedThreshold + parsedSequence;
}
