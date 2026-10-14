import * as text from "../../../../kit/text.js";
import { EnrollmentSummary } from "./enrollment-summary.js";

/** How screens and exports show a enrollment summary. */
export class EnrollmentSummaryView {
  code: string;
  titleText: string;
  createdAt: string;
  externalRef: string;
  costText: string;
  capacity: string;
  channel: string;
  checksum: string;
  floorValueText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    createdAt: string,
    externalRef: string,
    costText: string,
    capacity: string,
    channel: string,
    checksum: string,
    floorValueText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.costText = costText;
    this.capacity = capacity;
    this.channel = channel;
    this.checksum = checksum;
    this.floorValueText = floorValueText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentSummaryView(item: EnrollmentSummary): EnrollmentSummaryView {
  return new EnrollmentSummaryView(
    item.code,
    text.truncate(item.title, 80),
    String(item.createdAt),
    item.externalRef,
    item.cost.toFixed(2),
    String(item.capacity),
    item.channel,
    text.truncate(item.checksum, 80),
    item.floorValue.toFixed(2),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentSummaryViews(items: EnrollmentSummary[]): EnrollmentSummaryView[] {
  const views: EnrollmentSummaryView[] = [];
  for (const item of items) {
    views.push(toEnrollmentSummaryView(item));
  }
  return views;
}

export function sumEnrollmentSummaryView(view: EnrollmentSummaryView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCreatedAt + parsedCost + parsedCapacity;
}
