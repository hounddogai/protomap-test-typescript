import * as text from "../../../../kit/text.js";
import { TicketViewSnapshot } from "./ticket-view-snapshot.js";

/** How screens and exports show a ticket view snapshot. */
export class TicketViewSnapshotView {
  code: string;
  label: string;
  utmSource: string;
  cohort: string;
  updatedAtText: string;
  floorValue: string;
  limit: string;
  active: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    cohort: string,
    updatedAtText: string,
    floorValue: string,
    limit: string,
    active: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.cohort = cohort;
    this.updatedAtText = updatedAtText;
    this.floorValue = floorValue;
    this.limit = limit;
    this.active = active;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewSnapshotView(item: TicketViewSnapshot): TicketViewSnapshotView {
  return new TicketViewSnapshotView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    item.utmSource,
    text.truncate(item.cohort, 40),
    String(item.updatedAt),
    item.floorValue.toFixed(2),
    String(item.limit),
    `${item.active}`,
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewSnapshotViews(items: TicketViewSnapshot[]): TicketViewSnapshotView[] {
  const views: TicketViewSnapshotView[] = [];
  for (const item of items) {
    views.push(toTicketViewSnapshotView(item));
  }
  return views;
}

export function sumTicketViewSnapshotView(view: TicketViewSnapshotView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedUpdatedAt + parsedFloorValue + parsedLimit;
}
