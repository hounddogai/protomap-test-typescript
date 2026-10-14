import * as text from "../../../../kit/text.js";
import { RollingPostSlot } from "./rolling-post-slot.js";

/** How screens and exports show a rolling post slot. */
export class RollingPostSlotView {
  code: string;
  name: string;
  updatedAt: string;
  ownerId: string;
  segmentText: string;
  externalRefText: string;
  sequenceText: string;
  attempts: string;
  impressionsText: string;
  priority: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    ownerId: string,
    segmentText: string,
    externalRefText: string,
    sequenceText: string,
    attempts: string,
    impressionsText: string,
    priority: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
    this.segmentText = segmentText;
    this.externalRefText = externalRefText;
    this.sequenceText = sequenceText;
    this.attempts = attempts;
    this.impressionsText = impressionsText;
    this.priority = priority;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPostSlotView(item: RollingPostSlot): RollingPostSlotView {
  return new RollingPostSlotView(
    item.code,
    item.name,
    String(item.updatedAt),
    text.truncate(item.ownerId, 40),
    item.segment,
    item.externalRef,
    String(item.sequence),
    String(item.attempts),
    String(item.impressions),
    String(item.priority),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPostSlotViews(items: RollingPostSlot[]): RollingPostSlotView[] {
  const views: RollingPostSlotView[] = [];
  for (const item of items) {
    views.push(toRollingPostSlotView(item));
  }
  return views;
}

export function sumRollingPostSlotView(view: RollingPostSlotView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedUpdatedAt + parsedSequence + parsedAttempts;
}
