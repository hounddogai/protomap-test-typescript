import { RegionalSlaDigest } from "./regional-sla-digest.js";

/** How screens and exports show a regional sla digest. */
export class RegionalSlaDigestView {
  code: string;
  name: string;
  capacity: string;
  floorValue: string;
  priority: string;
  version: string;
  score: string;
  batchSize: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacity: string,
    floorValue: string,
    priority: string,
    version: string,
    score: string,
    batchSize: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.priority = priority;
    this.version = version;
    this.score = score;
    this.batchSize = batchSize;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSlaDigestView(item: RegionalSlaDigest): RegionalSlaDigestView {
  return new RegionalSlaDigestView(
    item.code,
    item.name,
    String(item.capacity),
    item.floorValue.toFixed(2),
    String(item.priority),
    String(item.version),
    item.score.toFixed(2),
    String(item.batchSize),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSlaDigestViews(items: RegionalSlaDigest[]): RegionalSlaDigestView[] {
  const views: RegionalSlaDigestView[] = [];
  for (const item of items) {
    views.push(toRegionalSlaDigestView(item));
  }
  return views;
}

export function sumRegionalSlaDigestView(view: RegionalSlaDigestView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedCapacity + parsedFloorValue + parsedPriority;
}
