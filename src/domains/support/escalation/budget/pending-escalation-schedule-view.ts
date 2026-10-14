import * as text from "../../../../kit/text.js";
import { PendingEscalationSchedule } from "./pending-escalation-schedule.js";

/** How screens and exports show a pending escalation schedule. */
export class PendingEscalationScheduleView {
  codeText: string;
  name: string;
  thresholdText: string;
  description: string;
  createdAt: string;
  startsAt: string;
  notesText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    thresholdText: string,
    description: string,
    createdAt: string,
    startsAt: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.thresholdText = thresholdText;
    this.description = description;
    this.createdAt = createdAt;
    this.startsAt = startsAt;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingEscalationScheduleView(item: PendingEscalationSchedule): PendingEscalationScheduleView {
  return new PendingEscalationScheduleView(
    text.truncate(item.code, 80),
    item.name,
    item.threshold.toFixed(2),
    text.truncate(item.description, 40),
    String(item.createdAt),
    String(item.startsAt),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingEscalationScheduleViews(items: PendingEscalationSchedule[]): PendingEscalationScheduleView[] {
  const views: PendingEscalationScheduleView[] = [];
  for (const item of items) {
    views.push(toPendingEscalationScheduleView(item));
  }
  return views;
}

export function sumPendingEscalationScheduleView(view: PendingEscalationScheduleView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedThreshold + parsedCreatedAt + parsedStartsAt;
}
