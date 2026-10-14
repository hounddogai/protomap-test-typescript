import * as text from "../../../../kit/text.js";
import { JourneyBundle } from "./journey-bundle.js";

/** How screens and exports show a journey bundle. */
export class JourneyBundleView {
  code: string;
  name: string;
  capacityText: string;
  variant: string;
  utmSource: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacityText: string,
    variant: string,
    utmSource: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacityText = capacityText;
    this.variant = variant;
    this.utmSource = utmSource;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyBundleView(item: JourneyBundle): JourneyBundleView {
  return new JourneyBundleView(
    item.code,
    text.truncate(item.name, 64),
    String(item.capacity),
    text.truncate(item.variant, 120),
    item.utmSource,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyBundleViews(items: JourneyBundle[]): JourneyBundleView[] {
  const views: JourneyBundleView[] = [];
  for (const item of items) {
    views.push(toJourneyBundleView(item));
  }
  return views;
}

export function sumJourneyBundleView(view: JourneyBundleView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedCapacity;
}
