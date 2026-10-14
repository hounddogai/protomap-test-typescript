import * as text from "../../../../kit/text.js";
import { FrequencySnapshot } from "./frequency-snapshot.js";

/** How screens and exports show a frequency snapshot. */
export class FrequencySnapshotView {
  codeText: string;
  title: string;
  source: string;
  cohort: string;
  region: string;
  frequencyCapText: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    source: string,
    cohort: string,
    region: string,
    frequencyCapText: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.source = source;
    this.cohort = cohort;
    this.region = region;
    this.frequencyCapText = frequencyCapText;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencySnapshotView(item: FrequencySnapshot): FrequencySnapshotView {
  return new FrequencySnapshotView(
    text.truncate(item.code, 64),
    item.title,
    item.source,
    text.truncate(item.cohort, 80),
    text.truncate(item.region, 40),
    String(item.frequencyCap),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencySnapshotViews(items: FrequencySnapshot[]): FrequencySnapshotView[] {
  const views: FrequencySnapshotView[] = [];
  for (const item of items) {
    views.push(toFrequencySnapshotView(item));
  }
  return views;
}

export function sumFrequencySnapshotView(view: FrequencySnapshotView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedFrequencyCap;
}
