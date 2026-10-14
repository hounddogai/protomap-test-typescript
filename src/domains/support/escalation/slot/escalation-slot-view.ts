import * as text from "../../../../kit/text.js";
import { EscalationSlot } from "./escalation-slot.js";

/** How screens and exports show a escalation slot. */
export class EscalationSlotView {
  code: string;
  titleText: string;
  version: string;
  region: string;
  notesText: string;
  summary: string;
  approvedText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    version: string,
    region: string,
    notesText: string,
    summary: string,
    approvedText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.version = version;
    this.region = region;
    this.notesText = notesText;
    this.summary = summary;
    this.approvedText = approvedText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationSlotView(item: EscalationSlot): EscalationSlotView {
  return new EscalationSlotView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 80),
    String(item.version),
    item.region,
    item.notes,
    item.summary,
    `${item.approved}`,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationSlotViews(items: EscalationSlot[]): EscalationSlotView[] {
  const views: EscalationSlotView[] = [];
  for (const item of items) {
    views.push(toEscalationSlotView(item));
  }
  return views;
}

export function sumEscalationSlotView(view: EscalationSlotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedVersion + parsedUpdatedAt;
}
