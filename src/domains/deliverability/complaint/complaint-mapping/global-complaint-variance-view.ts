import * as text from "../../../../kit/text.js";
import { GlobalComplaintVariance } from "./global-complaint-variance.js";

/** How screens and exports show a global complaint variance. */
export class GlobalComplaintVarianceView {
  code: string;
  label: string;
  minimum: string;
  createdAt: string;
  channelText: string;
  frequencyCap: string;
  ratio: string;
  limit: string;
  externalRef: string;
  segment: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    createdAt: string,
    channelText: string,
    frequencyCap: string,
    ratio: string,
    limit: string,
    externalRef: string,
    segment: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.channelText = channelText;
    this.frequencyCap = frequencyCap;
    this.ratio = ratio;
    this.limit = limit;
    this.externalRef = externalRef;
    this.segment = segment;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalComplaintVarianceView(item: GlobalComplaintVariance): GlobalComplaintVarianceView {
  return new GlobalComplaintVarianceView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    String(item.createdAt),
    item.channel,
    String(item.frequencyCap),
    item.ratio.toFixed(2),
    String(item.limit),
    item.externalRef,
    item.segment,
    text.truncate(item.notes, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalComplaintVarianceViews(items: GlobalComplaintVariance[]): GlobalComplaintVarianceView[] {
  const views: GlobalComplaintVarianceView[] = [];
  for (const item of items) {
    views.push(toGlobalComplaintVarianceView(item));
  }
  return views;
}

export function sumGlobalComplaintVarianceView(view: GlobalComplaintVarianceView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedMinimum + parsedCreatedAt + parsedFrequencyCap;
}
