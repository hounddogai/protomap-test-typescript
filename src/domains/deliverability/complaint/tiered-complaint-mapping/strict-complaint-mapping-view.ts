import * as text from "../../../../kit/text.js";
import { StrictComplaintMapping } from "./strict-complaint-mapping.js";

/** How screens and exports show a strict complaint mapping. */
export class StrictComplaintMappingView {
  code: string;
  name: string;
  capacityText: string;
  currency: string;
  openRateText: string;
  notes: string;
  archived: string;
  region: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacityText: string,
    currency: string,
    openRateText: string,
    notes: string,
    archived: string,
    region: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacityText = capacityText;
    this.currency = currency;
    this.openRateText = openRateText;
    this.notes = notes;
    this.archived = archived;
    this.region = region;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictComplaintMappingView(item: StrictComplaintMapping): StrictComplaintMappingView {
  return new StrictComplaintMappingView(
    item.code,
    text.truncate(item.name, 64),
    String(item.capacity),
    text.truncate(item.currency, 40),
    item.openRate.toFixed(2),
    text.truncate(item.notes, 40),
    `${item.archived}`,
    item.region,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictComplaintMappingViews(items: StrictComplaintMapping[]): StrictComplaintMappingView[] {
  const views: StrictComplaintMappingView[] = [];
  for (const item of items) {
    views.push(toStrictComplaintMappingView(item));
  }
  return views;
}

export function sumStrictComplaintMappingView(view: StrictComplaintMappingView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedCapacity + parsedOpenRate + parsedAttempts;
}
