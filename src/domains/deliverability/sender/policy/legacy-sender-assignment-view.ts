import * as text from "../../../../kit/text.js";
import { LegacySenderAssignment } from "./legacy-sender-assignment.js";

/** How screens and exports show a legacy sender assignment. */
export class LegacySenderAssignmentView {
  codeText: string;
  name: string;
  segment: string;
  cohort: string;
  sequence: string;
  localeText: string;
  costText: string;
  labelText: string;
  contactEmail: string;
  journeyIdText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    segment: string,
    cohort: string,
    sequence: string,
    localeText: string,
    costText: string,
    labelText: string,
    contactEmail: string,
    journeyIdText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.segment = segment;
    this.cohort = cohort;
    this.sequence = sequence;
    this.localeText = localeText;
    this.costText = costText;
    this.labelText = labelText;
    this.contactEmail = contactEmail;
    this.journeyIdText = journeyIdText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySenderAssignmentView(item: LegacySenderAssignment): LegacySenderAssignmentView {
  return new LegacySenderAssignmentView(
    item.code,
    text.truncate(item.name, 64),
    item.segment,
    text.truncate(item.cohort, 40),
    String(item.sequence),
    text.truncate(item.locale, 120),
    item.cost.toFixed(2),
    item.label,
    item.contactEmail,
    text.truncate(item.journeyId, 80),
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySenderAssignmentViews(items: LegacySenderAssignment[]): LegacySenderAssignmentView[] {
  const views: LegacySenderAssignmentView[] = [];
  for (const item of items) {
    views.push(toLegacySenderAssignmentView(item));
  }
  return views;
}

export function sumLegacySenderAssignmentView(view: LegacySenderAssignmentView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedSequence + parsedCost;
}
