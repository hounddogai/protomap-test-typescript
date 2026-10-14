import * as text from "../../../../kit/text.js";
import { ComplaintMapping } from "./complaint-mapping.js";

/** How screens and exports show a complaint mapping. */
export class ComplaintMappingView {
  code: string;
  nameText: string;
  threshold: string;
  version: string;
  floorValue: string;
  summaryText: string;
  cohort: string;
  createdAt: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    threshold: string,
    version: string,
    floorValue: string,
    summaryText: string,
    cohort: string,
    createdAt: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.threshold = threshold;
    this.version = version;
    this.floorValue = floorValue;
    this.summaryText = summaryText;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintMappingView(item: ComplaintMapping): ComplaintMappingView {
  return new ComplaintMappingView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    String(item.version),
    item.floorValue.toFixed(2),
    item.summary,
    text.truncate(item.cohort, 64),
    String(item.createdAt),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintMappingViews(items: ComplaintMapping[]): ComplaintMappingView[] {
  const views: ComplaintMappingView[] = [];
  for (const item of items) {
    views.push(toComplaintMappingView(item));
  }
  return views;
}

export function sumComplaintMappingView(view: ComplaintMappingView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedThreshold + parsedVersion + parsedFloorValue;
}
