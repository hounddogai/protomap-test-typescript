import * as text from "../../../../kit/text.js";
import { LenientFlightManifest } from "./lenient-flight-manifest.js";

/** How screens and exports show a lenient flight manifest. */
export class LenientFlightManifestView {
  code: string;
  label: string;
  reviewer: string;
  sendAtText: string;
  channel: string;
  titleText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    sendAtText: string,
    channel: string,
    titleText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.sendAtText = sendAtText;
    this.channel = channel;
    this.titleText = titleText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFlightManifestView(item: LenientFlightManifest): LenientFlightManifestView {
  return new LenientFlightManifestView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 40),
    item.reviewer,
    String(item.sendAt),
    text.truncate(item.channel, 40),
    text.truncate(item.title, 120),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFlightManifestViews(items: LenientFlightManifest[]): LenientFlightManifestView[] {
  const views: LenientFlightManifestView[] = [];
  for (const item of items) {
    views.push(toLenientFlightManifestView(item));
  }
  return views;
}

export function sumLenientFlightManifestView(view: LenientFlightManifestView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedSendAt + parsedRetries;
}
