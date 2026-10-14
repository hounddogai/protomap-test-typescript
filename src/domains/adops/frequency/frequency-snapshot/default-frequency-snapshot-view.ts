import * as text from "../../../../kit/text.js";
import { DefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

/** How screens and exports show a default frequency snapshot. */
export class DefaultFrequencySnapshotView {
  code: string;
  nameText: string;
  version: string;
  sequence: string;
  durationMinutes: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    version: string,
    sequence: string,
    durationMinutes: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.version = version;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFrequencySnapshotView(item: DefaultFrequencySnapshot): DefaultFrequencySnapshotView {
  return new DefaultFrequencySnapshotView(
    text.truncate(item.code, 120),
    item.name,
    String(item.version),
    String(item.sequence),
    String(item.durationMinutes),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFrequencySnapshotViews(items: DefaultFrequencySnapshot[]): DefaultFrequencySnapshotView[] {
  const views: DefaultFrequencySnapshotView[] = [];
  for (const item of items) {
    views.push(toDefaultFrequencySnapshotView(item));
  }
  return views;
}

export function sumDefaultFrequencySnapshotView(view: DefaultFrequencySnapshotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedVersion + parsedSequence + parsedDurationMinutes;
}
