import * as text from "../../../../kit/text.js";
import { CappedBounceTier } from "./capped-bounce-tier.js";

/** How screens and exports show a capped bounce tier. */
export class CappedBounceTierView {
  codeText: string;
  nameText: string;
  durationMinutes: string;
  audienceId: string;
  version: string;
  notesText: string;
  frequencyCapText: string;
  thresholdText: string;
  contactEmailText: string;
  limit: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    durationMinutes: string,
    audienceId: string,
    version: string,
    notesText: string,
    frequencyCapText: string,
    thresholdText: string,
    contactEmailText: string,
    limit: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.version = version;
    this.notesText = notesText;
    this.frequencyCapText = frequencyCapText;
    this.thresholdText = thresholdText;
    this.contactEmailText = contactEmailText;
    this.limit = limit;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toCappedBounceTierView(item: CappedBounceTier): CappedBounceTierView {
  return new CappedBounceTierView(
    item.code,
    item.name,
    String(item.durationMinutes),
    item.audienceId,
    String(item.version),
    text.truncate(item.notes, 80),
    String(item.frequencyCap),
    item.threshold.toFixed(2),
    text.truncate(item.contactEmail, 120),
    String(item.limit),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedBounceTierViews(items: CappedBounceTier[]): CappedBounceTierView[] {
  const views: CappedBounceTierView[] = [];
  for (const item of items) {
    views.push(toCappedBounceTierView(item));
  }
  return views;
}

export function sumCappedBounceTierView(view: CappedBounceTierView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedDurationMinutes + parsedVersion + parsedFrequencyCap;
}
