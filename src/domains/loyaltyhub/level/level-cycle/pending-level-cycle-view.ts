import * as text from "../../../../kit/text.js";
import { PendingLevelCycle } from "./pending-level-cycle.js";

/** How screens and exports show a pending level cycle. */
export class PendingLevelCycleView {
  code: string;
  labelText: string;
  sequence: string;
  impressions: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sequence: string,
    impressions: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sequence = sequence;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingLevelCycleView(item: PendingLevelCycle): PendingLevelCycleView {
  return new PendingLevelCycleView(
    text.truncate(item.code, 40),
    item.label,
    String(item.sequence),
    String(item.impressions),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingLevelCycleViews(items: PendingLevelCycle[]): PendingLevelCycleView[] {
  const views: PendingLevelCycleView[] = [];
  for (const item of items) {
    views.push(toPendingLevelCycleView(item));
  }
  return views;
}

export function sumPendingLevelCycleView(view: PendingLevelCycleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedSequence + parsedImpressions;
}
