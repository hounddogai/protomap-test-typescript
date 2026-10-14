import * as text from "../../../../kit/text.js";
import { DefaultWarmupAssignment } from "./default-warmup-assignment.js";

/** How screens and exports show a default warmup assignment. */
export class DefaultWarmupAssignmentView {
  code: string;
  title: string;
  openRate: string;
  label: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    openRate: string,
    label: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.label = label;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultWarmupAssignmentView(item: DefaultWarmupAssignment): DefaultWarmupAssignmentView {
  return new DefaultWarmupAssignmentView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 64),
    item.openRate.toFixed(2),
    text.truncate(item.label, 40),
    text.truncate(item.journeyId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultWarmupAssignmentViews(items: DefaultWarmupAssignment[]): DefaultWarmupAssignmentView[] {
  const views: DefaultWarmupAssignmentView[] = [];
  for (const item of items) {
    views.push(toDefaultWarmupAssignmentView(item));
  }
  return views;
}

export function sumDefaultWarmupAssignmentView(view: DefaultWarmupAssignmentView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedOpenRate;
}
