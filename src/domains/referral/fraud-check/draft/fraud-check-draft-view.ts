import { FraudCheckDraft } from "./fraud-check-draft.js";

/** How screens and exports show a fraud check draft. */
export class FraudCheckDraftView {
  code: string;
  name: string;
  windowDays: string;
  unit: string;
  clicksText: string;
  description: string;
  journeyIdText: string;
  archived: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDays: string,
    unit: string,
    clicksText: string,
    description: string,
    journeyIdText: string,
    archived: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.unit = unit;
    this.clicksText = clicksText;
    this.description = description;
    this.journeyIdText = journeyIdText;
    this.archived = archived;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckDraftView(item: FraudCheckDraft): FraudCheckDraftView {
  return new FraudCheckDraftView(
    item.code,
    item.name,
    String(item.windowDays),
    item.unit,
    String(item.clicks),
    item.description,
    item.journeyId,
    `${item.archived}`,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckDraftViews(items: FraudCheckDraft[]): FraudCheckDraftView[] {
  const views: FraudCheckDraftView[] = [];
  for (const item of items) {
    views.push(toFraudCheckDraftView(item));
  }
  return views;
}

export function sumFraudCheckDraftView(view: FraudCheckDraftView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedWindowDays + parsedClicks + parsedCapacity;
}
