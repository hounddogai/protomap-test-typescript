import * as text from "../../../../kit/text.js";
import { JourneyManifest } from "./journey-manifest.js";

/** How screens and exports show a journey manifest. */
export class JourneyManifestView {
  code: string;
  name: string;
  externalRefText: string;
  checksum: string;
  frequencyCap: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRefText: string,
    checksum: string,
    frequencyCap: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRefText = externalRefText;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyManifestView(item: JourneyManifest): JourneyManifestView {
  return new JourneyManifestView(
    item.code,
    text.truncate(item.name, 40),
    item.externalRef,
    item.checksum,
    String(item.frequencyCap),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyManifestViews(items: JourneyManifest[]): JourneyManifestView[] {
  const views: JourneyManifestView[] = [];
  for (const item of items) {
    views.push(toJourneyManifestView(item));
  }
  return views;
}

export function sumJourneyManifestView(view: JourneyManifestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedFrequencyCap + parsedCreatedAt;
}
