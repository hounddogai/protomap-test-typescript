import * as text from "../../../../kit/text.js";
import { StrictWindowGroup } from "./strict-window-group.js";

/** How screens and exports show a strict window group. */
export class StrictWindowGroupView {
  code: string;
  label: string;
  active: string;
  channel: string;
  retriesText: string;
  clicksText: string;
  weight: string;
  frequencyCap: string;
  openRate: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    active: string,
    channel: string,
    retriesText: string,
    clicksText: string,
    weight: string,
    frequencyCap: string,
    openRate: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.channel = channel;
    this.retriesText = retriesText;
    this.clicksText = clicksText;
    this.weight = weight;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toStrictWindowGroupView(item: StrictWindowGroup): StrictWindowGroupView {
  return new StrictWindowGroupView(
    item.code,
    text.truncate(item.label, 80),
    `${item.active}`,
    text.truncate(item.channel, 64),
    String(item.retries),
    String(item.clicks),
    item.weight.toFixed(2),
    String(item.frequencyCap),
    item.openRate.toFixed(2),
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictWindowGroupViews(items: StrictWindowGroup[]): StrictWindowGroupView[] {
  const views: StrictWindowGroupView[] = [];
  for (const item of items) {
    views.push(toStrictWindowGroupView(item));
  }
  return views;
}

export function sumStrictWindowGroupView(view: StrictWindowGroupView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedRetries + parsedClicks + parsedWeight;
}
