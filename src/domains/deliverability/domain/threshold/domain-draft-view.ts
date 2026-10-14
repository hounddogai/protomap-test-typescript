import * as text from "../../../../kit/text.js";
import { DomainDraft } from "./domain-draft.js";

/** How screens and exports show a domain draft. */
export class DomainDraftView {
  code: string;
  label: string;
  priority: string;
  createdAtText: string;
  capacity: string;
  checksumText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    createdAtText: string,
    capacity: string,
    checksumText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.createdAtText = createdAtText;
    this.capacity = capacity;
    this.checksumText = checksumText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainDraftView(item: DomainDraft): DomainDraftView {
  return new DomainDraftView(
    item.code,
    item.label,
    String(item.priority),
    String(item.createdAt),
    String(item.capacity),
    item.checksum,
    text.truncate(item.region, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainDraftViews(items: DomainDraft[]): DomainDraftView[] {
  const views: DomainDraftView[] = [];
  for (const item of items) {
    views.push(toDomainDraftView(item));
  }
  return views;
}

export function sumDomainDraftView(view: DomainDraftView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedPriority + parsedCreatedAt + parsedCapacity;
}
