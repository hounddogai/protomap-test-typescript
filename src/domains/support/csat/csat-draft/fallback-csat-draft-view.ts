import * as text from "../../../../kit/text.js";
import { FallbackCsatDraft } from "./fallback-csat-draft.js";

/** How screens and exports show a fallback csat draft. */
export class FallbackCsatDraftView {
  codeText: string;
  name: string;
  sendAtText: string;
  capacity: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    sendAtText: string,
    capacity: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.sendAtText = sendAtText;
    this.capacity = capacity;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCsatDraftView(item: FallbackCsatDraft): FallbackCsatDraftView {
  return new FallbackCsatDraftView(
    item.code,
    text.truncate(item.name, 64),
    String(item.sendAt),
    String(item.capacity),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCsatDraftViews(items: FallbackCsatDraft[]): FallbackCsatDraftView[] {
  const views: FallbackCsatDraftView[] = [];
  for (const item of items) {
    views.push(toFallbackCsatDraftView(item));
  }
  return views;
}

export function sumFallbackCsatDraftView(view: FallbackCsatDraftView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedSendAt + parsedCapacity + parsedPriority;
}
