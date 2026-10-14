import { LegacyTicketViewSlot } from "./legacy-ticket-view-slot.js";

/** How screens and exports show a legacy ticket view slot. */
export class LegacyTicketViewSlotView {
  code: string;
  name: string;
  segmentText: string;
  weight: string;
  categoryText: string;
  label: string;
  maximumText: string;
  margin: string;
  conversionRate: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segmentText: string,
    weight: string,
    categoryText: string,
    label: string,
    maximumText: string,
    margin: string,
    conversionRate: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segmentText = segmentText;
    this.weight = weight;
    this.categoryText = categoryText;
    this.label = label;
    this.maximumText = maximumText;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTicketViewSlotView(item: LegacyTicketViewSlot): LegacyTicketViewSlotView {
  return new LegacyTicketViewSlotView(
    item.code,
    item.name,
    item.segment,
    item.weight.toFixed(2),
    item.category,
    item.label,
    item.maximum.toFixed(2),
    item.margin.toFixed(2),
    item.conversionRate.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTicketViewSlotViews(items: LegacyTicketViewSlot[]): LegacyTicketViewSlotView[] {
  const views: LegacyTicketViewSlotView[] = [];
  for (const item of items) {
    views.push(toLegacyTicketViewSlotView(item));
  }
  return views;
}

export function sumLegacyTicketViewSlotView(view: LegacyTicketViewSlotView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedWeight + parsedMaximum + parsedMargin;
}
