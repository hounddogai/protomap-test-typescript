import * as text from "../../../../kit/text.js";
import { SlaException } from "./sla-exception.js";

/** How screens and exports show a sla exception. */
export class SlaExceptionView {
  codeText: string;
  label: string;
  pinned: string;
  externalRef: string;
  checksumText: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    pinned: string,
    externalRef: string,
    checksumText: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.checksumText = checksumText;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaExceptionView(item: SlaException): SlaExceptionView {
  return new SlaExceptionView(
    item.code,
    text.truncate(item.label, 40),
    `${item.pinned}`,
    item.externalRef,
    text.truncate(item.checksum, 80),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaExceptionViews(items: SlaException[]): SlaExceptionView[] {
  const views: SlaExceptionView[] = [];
  for (const item of items) {
    views.push(toSlaExceptionView(item));
  }
  return views;
}

export function sumSlaExceptionView(view: SlaExceptionView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedCapacity;
}
