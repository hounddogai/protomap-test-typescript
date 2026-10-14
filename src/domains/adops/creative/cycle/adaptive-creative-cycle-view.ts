import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeCycle } from "./adaptive-creative-cycle.js";

/** How screens and exports show a adaptive creative cycle. */
export class AdaptiveCreativeCycleView {
  code: string;
  name: string;
  limit: string;
  segment: string;
  sequenceText: string;
  sendAt: string;
  timezoneText: string;
  externalRef: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    segment: string,
    sequenceText: string,
    sendAt: string,
    timezoneText: string,
    externalRef: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.segment = segment;
    this.sequenceText = sequenceText;
    this.sendAt = sendAt;
    this.timezoneText = timezoneText;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCreativeCycleView(item: AdaptiveCreativeCycle): AdaptiveCreativeCycleView {
  return new AdaptiveCreativeCycleView(
    item.code,
    text.truncate(item.name, 120),
    String(item.limit),
    item.segment,
    String(item.sequence),
    String(item.sendAt),
    item.timezone,
    text.truncate(item.externalRef, 64),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCreativeCycleViews(items: AdaptiveCreativeCycle[]): AdaptiveCreativeCycleView[] {
  const views: AdaptiveCreativeCycleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCreativeCycleView(item));
  }
  return views;
}

export function sumAdaptiveCreativeCycleView(view: AdaptiveCreativeCycleView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedLimit + parsedSequence + parsedSendAt;
}
