import * as text from "../../../../kit/text.js";
import { SlaGroup } from "./sla-group.js";

/** How screens and exports show a sla group. */
export class SlaGroupView {
  code: string;
  title: string;
  endsAt: string;
  archivedText: string;
  priority: string;
  timezone: string;
  regionText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    archivedText: string,
    priority: string,
    timezone: string,
    regionText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.archivedText = archivedText;
    this.priority = priority;
    this.timezone = timezone;
    this.regionText = regionText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toSlaGroupView(item: SlaGroup): SlaGroupView {
  return new SlaGroupView(
    item.code,
    item.title,
    String(item.endsAt),
    `${item.archived}`,
    String(item.priority),
    text.truncate(item.timezone, 120),
    item.region,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaGroupViews(items: SlaGroup[]): SlaGroupView[] {
  const views: SlaGroupView[] = [];
  for (const item of items) {
    views.push(toSlaGroupView(item));
  }
  return views;
}

export function sumSlaGroupView(view: SlaGroupView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedEndsAt + parsedPriority + parsedSequence;
}
