import * as text from "../../../../kit/text.js";
import { PendingPacingTarget } from "./pending-pacing-target.js";

/** How screens and exports show a pending pacing target. */
export class PendingPacingTargetView {
  code: string;
  nameText: string;
  label: string;
  frequencyCapText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    label: string,
    frequencyCapText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.label = label;
    this.frequencyCapText = frequencyCapText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPacingTargetView(item: PendingPacingTarget): PendingPacingTargetView {
  return new PendingPacingTargetView(
    item.code,
    item.name,
    text.truncate(item.label, 64),
    String(item.frequencyCap),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPacingTargetViews(items: PendingPacingTarget[]): PendingPacingTargetView[] {
  const views: PendingPacingTargetView[] = [];
  for (const item of items) {
    views.push(toPendingPacingTargetView(item));
  }
  return views;
}

export function sumPendingPacingTargetView(view: PendingPacingTargetView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedFrequencyCap;
}
