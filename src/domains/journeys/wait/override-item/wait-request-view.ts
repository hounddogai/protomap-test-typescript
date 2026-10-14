import * as text from "../../../../kit/text.js";
import { WaitRequest } from "./wait-request.js";

/** How screens and exports show a wait request. */
export class WaitRequestView {
  code: string;
  title: string;
  updatedAt: string;
  segment: string;
  notes: string;
  label: string;
  attemptsText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    updatedAt: string,
    segment: string,
    notes: string,
    label: string,
    attemptsText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.segment = segment;
    this.notes = notes;
    this.label = label;
    this.attemptsText = attemptsText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toWaitRequestView(item: WaitRequest): WaitRequestView {
  return new WaitRequestView(
    item.code,
    item.title,
    String(item.updatedAt),
    text.truncate(item.segment, 64),
    text.truncate(item.notes, 40),
    item.label,
    String(item.attempts),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitRequestViews(items: WaitRequest[]): WaitRequestView[] {
  const views: WaitRequestView[] = [];
  for (const item of items) {
    views.push(toWaitRequestView(item));
  }
  return views;
}

export function sumWaitRequestView(view: WaitRequestView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedUpdatedAt + parsedAttempts + parsedCapacity;
}
