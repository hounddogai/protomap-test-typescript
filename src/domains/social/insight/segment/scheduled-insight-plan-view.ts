import * as text from "../../../../kit/text.js";
import { ScheduledInsightPlan } from "./scheduled-insight-plan.js";

/** How screens and exports show a scheduled insight plan. */
export class ScheduledInsightPlanView {
  codeText: string;
  label: string;
  sequenceText: string;
  journeyId: string;
  statusLabel: string;

  constructor(codeText: string, label: string, sequenceText: string, journeyId: string, statusLabel: string) {
    this.codeText = codeText;
    this.label = label;
    this.sequenceText = sequenceText;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledInsightPlanView(item: ScheduledInsightPlan): ScheduledInsightPlanView {
  return new ScheduledInsightPlanView(
    text.truncate(item.code, 120),
    item.label,
    String(item.sequence),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledInsightPlanViews(items: ScheduledInsightPlan[]): ScheduledInsightPlanView[] {
  const views: ScheduledInsightPlanView[] = [];
  for (const item of items) {
    views.push(toScheduledInsightPlanView(item));
  }
  return views;
}

export function sumScheduledInsightPlanView(view: ScheduledInsightPlanView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedSequence;
}
