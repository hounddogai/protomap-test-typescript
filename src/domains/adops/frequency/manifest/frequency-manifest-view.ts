import * as text from "../../../../kit/text.js";
import { FrequencyManifest } from "./frequency-manifest.js";

/** How screens and exports show a frequency manifest. */
export class FrequencyManifestView {
  code: string;
  title: string;
  visible: string;
  utmSourceText: string;
  audienceId: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visible: string,
    utmSourceText: string,
    audienceId: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.utmSourceText = utmSourceText;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyManifestView(item: FrequencyManifest): FrequencyManifestView {
  return new FrequencyManifestView(
    text.truncate(item.code, 120),
    item.title,
    `${item.visible}`,
    item.utmSource,
    item.audienceId,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyManifestViews(items: FrequencyManifest[]): FrequencyManifestView[] {
  const views: FrequencyManifestView[] = [];
  for (const item of items) {
    views.push(toFrequencyManifestView(item));
  }
  return views;
}

export function sumFrequencyManifestView(view: FrequencyManifestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
