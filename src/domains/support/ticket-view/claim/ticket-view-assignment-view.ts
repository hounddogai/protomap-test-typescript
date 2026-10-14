import * as text from "../../../../kit/text.js";
import { TicketViewAssignment } from "./ticket-view-assignment.js";

/** How screens and exports show a ticket view assignment. */
export class TicketViewAssignmentView {
  code: string;
  name: string;
  audienceIdText: string;
  startsAt: string;
  titleText: string;
  segment: string;
  minimumText: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    audienceIdText: string,
    startsAt: string,
    titleText: string,
    segment: string,
    minimumText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.audienceIdText = audienceIdText;
    this.startsAt = startsAt;
    this.titleText = titleText;
    this.segment = segment;
    this.minimumText = minimumText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewAssignmentView(item: TicketViewAssignment): TicketViewAssignmentView {
  return new TicketViewAssignmentView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    text.truncate(item.audienceId, 80),
    String(item.startsAt),
    text.truncate(item.title, 64),
    text.truncate(item.segment, 120),
    item.minimum.toFixed(2),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewAssignmentViews(items: TicketViewAssignment[]): TicketViewAssignmentView[] {
  const views: TicketViewAssignmentView[] = [];
  for (const item of items) {
    views.push(toTicketViewAssignmentView(item));
  }
  return views;
}

export function sumTicketViewAssignmentView(view: TicketViewAssignmentView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedStartsAt + parsedMinimum;
}
