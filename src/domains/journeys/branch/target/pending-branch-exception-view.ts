import * as text from "../../../../kit/text.js";
import { PendingBranchException } from "./pending-branch-exception.js";

/** How screens and exports show a pending branch exception. */
export class PendingBranchExceptionView {
  code: string;
  titleText: string;
  capacityText: string;
  name: string;
  checksum: string;
  graceDays: string;
  weightText: string;
  startsAt: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    capacityText: string,
    name: string,
    checksum: string,
    graceDays: string,
    weightText: string,
    startsAt: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.capacityText = capacityText;
    this.name = name;
    this.checksum = checksum;
    this.graceDays = graceDays;
    this.weightText = weightText;
    this.startsAt = startsAt;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBranchExceptionView(item: PendingBranchException): PendingBranchExceptionView {
  return new PendingBranchExceptionView(
    text.truncate(item.code, 80),
    item.title,
    String(item.capacity),
    item.name,
    item.checksum,
    String(item.graceDays),
    item.weight.toFixed(2),
    String(item.startsAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBranchExceptionViews(items: PendingBranchException[]): PendingBranchExceptionView[] {
  const views: PendingBranchExceptionView[] = [];
  for (const item of items) {
    views.push(toPendingBranchExceptionView(item));
  }
  return views;
}

export function sumPendingBranchExceptionView(view: PendingBranchExceptionView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedCapacity + parsedGraceDays + parsedWeight;
}
