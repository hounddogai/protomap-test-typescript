import { RegionalPlacementEntry } from "./regional-placement-entry.js";

/** How screens and exports show a regional placement entry. */
export class RegionalPlacementEntryView {
  code: string;
  title: string;
  weightText: string;
  openRate: string;
  sendAt: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    weightText: string,
    openRate: string,
    sendAt: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.weightText = weightText;
    this.openRate = openRate;
    this.sendAt = sendAt;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPlacementEntryView(item: RegionalPlacementEntry): RegionalPlacementEntryView {
  return new RegionalPlacementEntryView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    item.openRate.toFixed(2),
    String(item.sendAt),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPlacementEntryViews(items: RegionalPlacementEntry[]): RegionalPlacementEntryView[] {
  const views: RegionalPlacementEntryView[] = [];
  for (const item of items) {
    views.push(toRegionalPlacementEntryView(item));
  }
  return views;
}

export function sumRegionalPlacementEntryView(view: RegionalPlacementEntryView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedWeight + parsedOpenRate + parsedSendAt;
}
