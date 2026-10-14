import * as text from "../../../../kit/text.js";
import { LegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

/** How screens and exports show a legacy ticket view assignment. */
export class LegacyTicketViewAssignmentView {
  codeText: string;
  name: string;
  labelText: string;
  revision: string;
  margin: string;
  sequence: string;
  rate: string;
  pinnedText: string;
  category: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    labelText: string,
    revision: string,
    margin: string,
    sequence: string,
    rate: string,
    pinnedText: string,
    category: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.labelText = labelText;
    this.revision = revision;
    this.margin = margin;
    this.sequence = sequence;
    this.rate = rate;
    this.pinnedText = pinnedText;
    this.category = category;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTicketViewAssignmentView(item: LegacyTicketViewAssignment): LegacyTicketViewAssignmentView {
  return new LegacyTicketViewAssignmentView(
    item.code,
    text.truncate(item.name, 120),
    text.truncate(item.label, 64),
    String(item.revision),
    item.margin.toFixed(2),
    String(item.sequence),
    item.rate.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.category, 120),
    text.truncate(item.source, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTicketViewAssignmentViews(items: LegacyTicketViewAssignment[]): LegacyTicketViewAssignmentView[] {
  const views: LegacyTicketViewAssignmentView[] = [];
  for (const item of items) {
    views.push(toLegacyTicketViewAssignmentView(item));
  }
  return views;
}

export function sumLegacyTicketViewAssignmentView(view: LegacyTicketViewAssignmentView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRevision + parsedMargin + parsedSequence;
}
