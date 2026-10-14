import * as text from "../../../../kit/text.js";
import { DomainCycle } from "./domain-cycle.js";

/** How screens and exports show a domain cycle. */
export class DomainCycleView {
  code: string;
  name: string;
  variant: string;
  contactEmail: string;
  utmSourceText: string;
  unit: string;
  journeyId: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    variant: string,
    contactEmail: string,
    utmSourceText: string,
    unit: string,
    journeyId: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.contactEmail = contactEmail;
    this.utmSourceText = utmSourceText;
    this.unit = unit;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toDomainCycleView(item: DomainCycle): DomainCycleView {
  return new DomainCycleView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.variant, 120),
    item.contactEmail,
    text.truncate(item.utmSource, 40),
    item.unit,
    item.journeyId,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainCycleViews(items: DomainCycle[]): DomainCycleView[] {
  const views: DomainCycleView[] = [];
  for (const item of items) {
    views.push(toDomainCycleView(item));
  }
  return views;
}

export function sumDomainCycleView(view: DomainCycleView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCapacity;
}
