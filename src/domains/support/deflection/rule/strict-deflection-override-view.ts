import * as text from "../../../../kit/text.js";
import { StrictDeflectionOverride } from "./strict-deflection-override.js";

/** How screens and exports show a strict deflection override. */
export class StrictDeflectionOverrideView {
  code: string;
  titleText: string;
  channelText: string;
  frequencyCap: string;
  capacity: string;
  ratio: string;
  endsAt: string;
  ownerId: string;
  budget: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channelText: string,
    frequencyCap: string,
    capacity: string,
    ratio: string,
    endsAt: string,
    ownerId: string,
    budget: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channelText = channelText;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.ratio = ratio;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.budget = budget;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictDeflectionOverrideView(item: StrictDeflectionOverride): StrictDeflectionOverrideView {
  return new StrictDeflectionOverrideView(
    item.code,
    item.title,
    text.truncate(item.channel, 64),
    String(item.frequencyCap),
    String(item.capacity),
    item.ratio.toFixed(2),
    String(item.endsAt),
    text.truncate(item.ownerId, 40),
    item.budget.toFixed(2),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictDeflectionOverrideViews(items: StrictDeflectionOverride[]): StrictDeflectionOverrideView[] {
  const views: StrictDeflectionOverrideView[] = [];
  for (const item of items) {
    views.push(toStrictDeflectionOverrideView(item));
  }
  return views;
}

export function sumStrictDeflectionOverrideView(view: StrictDeflectionOverrideView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedFrequencyCap + parsedCapacity + parsedRatio;
}
