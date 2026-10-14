import * as text from "../../../../kit/text.js";
import { StepDigest } from "./step-digest.js";

/** How screens and exports show a step digest. */
export class StepDigestView {
  code: string;
  label: string;
  clicks: string;
  checksumText: string;
  activeText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicks: string,
    checksumText: string,
    activeText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.checksumText = checksumText;
    this.activeText = activeText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toStepDigestView(item: StepDigest): StepDigestView {
  return new StepDigestView(
    text.truncate(item.code, 64),
    item.label,
    String(item.clicks),
    text.truncate(item.checksum, 120),
    `${item.active}`,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepDigestViews(items: StepDigest[]): StepDigestView[] {
  const views: StepDigestView[] = [];
  for (const item of items) {
    views.push(toStepDigestView(item));
  }
  return views;
}

export function sumStepDigestView(view: StepDigestView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedClicks + parsedSequence;
}
