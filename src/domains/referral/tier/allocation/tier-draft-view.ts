import * as text from "../../../../kit/text.js";
import { TierDraft } from "./tier-draft.js";

/** How screens and exports show a tier draft. */
export class TierDraftView {
  code: string;
  name: string;
  attempts: string;
  checksum: string;
  version: string;
  label: string;
  audienceIdText: string;
  capacity: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    checksum: string,
    version: string,
    label: string,
    audienceIdText: string,
    capacity: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.checksum = checksum;
    this.version = version;
    this.label = label;
    this.audienceIdText = audienceIdText;
    this.capacity = capacity;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toTierDraftView(item: TierDraft): TierDraftView {
  return new TierDraftView(
    item.code,
    item.name,
    String(item.attempts),
    item.checksum,
    String(item.version),
    text.truncate(item.label, 40),
    item.audienceId,
    String(item.capacity),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTierDraftViews(items: TierDraft[]): TierDraftView[] {
  const views: TierDraftView[] = [];
  for (const item of items) {
    views.push(toTierDraftView(item));
  }
  return views;
}

export function sumTierDraftView(view: TierDraftView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedAttempts + parsedVersion + parsedCapacity;
}
