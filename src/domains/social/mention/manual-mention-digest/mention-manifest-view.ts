import * as text from "../../../../kit/text.js";
import { MentionManifest } from "./mention-manifest.js";

/** How screens and exports show a mention manifest. */
export class MentionManifestView {
  code: string;
  name: string;
  active: string;
  impressionsText: string;
  reviewer: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    active: string,
    impressionsText: string,
    reviewer: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.impressionsText = impressionsText;
    this.reviewer = reviewer;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toMentionManifestView(item: MentionManifest): MentionManifestView {
  return new MentionManifestView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    `${item.active}`,
    String(item.impressions),
    item.reviewer,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionManifestViews(items: MentionManifest[]): MentionManifestView[] {
  const views: MentionManifestView[] = [];
  for (const item of items) {
    views.push(toMentionManifestView(item));
  }
  return views;
}

export function sumMentionManifestView(view: MentionManifestView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedImpressions;
}
