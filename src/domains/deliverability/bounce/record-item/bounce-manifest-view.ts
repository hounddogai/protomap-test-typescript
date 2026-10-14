import * as text from "../../../../kit/text.js";
import { BounceManifest } from "./bounce-manifest.js";

/** How screens and exports show a bounce manifest. */
export class BounceManifestView {
  code: string;
  nameText: string;
  frequencyCapText: string;
  openRate: string;
  rate: string;
  campaignRef: string;
  capacity: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    frequencyCapText: string,
    openRate: string,
    rate: string,
    campaignRef: string,
    capacity: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.frequencyCapText = frequencyCapText;
    this.openRate = openRate;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toBounceManifestView(item: BounceManifest): BounceManifestView {
  return new BounceManifestView(
    item.code,
    text.truncate(item.name, 120),
    String(item.frequencyCap),
    item.openRate.toFixed(2),
    item.rate.toFixed(2),
    item.campaignRef,
    String(item.capacity),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceManifestViews(items: BounceManifest[]): BounceManifestView[] {
  const views: BounceManifestView[] = [];
  for (const item of items) {
    views.push(toBounceManifestView(item));
  }
  return views;
}

export function sumBounceManifestView(view: BounceManifestView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedFrequencyCap + parsedOpenRate + parsedRate;
}
