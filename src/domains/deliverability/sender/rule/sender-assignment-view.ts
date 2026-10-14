import * as text from "../../../../kit/text.js";
import { SenderAssignment } from "./sender-assignment.js";

/** How screens and exports show a sender assignment. */
export class SenderAssignmentView {
  codeText: string;
  name: string;
  country: string;
  versionText: string;
  capacityText: string;
  sourceText: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    country: string,
    versionText: string,
    capacityText: string,
    sourceText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.country = country;
    this.versionText = versionText;
    this.capacityText = capacityText;
    this.sourceText = sourceText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toSenderAssignmentView(item: SenderAssignment): SenderAssignmentView {
  return new SenderAssignmentView(
    text.truncate(item.code, 64),
    item.name,
    text.truncate(item.country, 80),
    String(item.version),
    String(item.capacity),
    text.truncate(item.source, 64),
    text.truncate(item.notes, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderAssignmentViews(items: SenderAssignment[]): SenderAssignmentView[] {
  const views: SenderAssignmentView[] = [];
  for (const item of items) {
    views.push(toSenderAssignmentView(item));
  }
  return views;
}

export function sumSenderAssignmentView(view: SenderAssignmentView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedVersion + parsedCapacity;
}
