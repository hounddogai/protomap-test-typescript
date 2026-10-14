import * as text from "../../../../kit/text.js";
import { ComplaintAllocation } from "./complaint-allocation.js";

/** How screens and exports show a complaint allocation. */
export class ComplaintAllocationView {
  code: string;
  name: string;
  frequencyCap: string;
  externalRef: string;
  segment: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    frequencyCap: string,
    externalRef: string,
    segment: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.externalRef = externalRef;
    this.segment = segment;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintAllocationView(item: ComplaintAllocation): ComplaintAllocationView {
  return new ComplaintAllocationView(
    item.code,
    text.truncate(item.name, 120),
    String(item.frequencyCap),
    text.truncate(item.externalRef, 64),
    item.segment,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintAllocationViews(items: ComplaintAllocation[]): ComplaintAllocationView[] {
  const views: ComplaintAllocationView[] = [];
  for (const item of items) {
    views.push(toComplaintAllocationView(item));
  }
  return views;
}

export function sumComplaintAllocationView(view: ComplaintAllocationView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
