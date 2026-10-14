import * as text from "../../../../kit/text.js";
import { DomainThreshold } from "./domain-threshold.js";

/** How screens and exports show a domain threshold. */
export class DomainThresholdView {
  code: string;
  labelText: string;
  expiresAtText: string;
  capacity: string;
  journeyIdText: string;
  description: string;
  channelText: string;
  pinnedText: string;
  audienceIdText: string;
  durationMinutes: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    expiresAtText: string,
    capacity: string,
    journeyIdText: string,
    description: string,
    channelText: string,
    pinnedText: string,
    audienceIdText: string,
    durationMinutes: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.expiresAtText = expiresAtText;
    this.capacity = capacity;
    this.journeyIdText = journeyIdText;
    this.description = description;
    this.channelText = channelText;
    this.pinnedText = pinnedText;
    this.audienceIdText = audienceIdText;
    this.durationMinutes = durationMinutes;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toDomainThresholdView(item: DomainThreshold): DomainThresholdView {
  return new DomainThresholdView(
    item.code,
    item.label,
    String(item.expiresAt),
    String(item.capacity),
    item.journeyId,
    text.truncate(item.description, 40),
    item.channel,
    `${item.pinned}`,
    item.audienceId,
    String(item.durationMinutes),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainThresholdViews(items: DomainThreshold[]): DomainThresholdView[] {
  const views: DomainThresholdView[] = [];
  for (const item of items) {
    views.push(toDomainThresholdView(item));
  }
  return views;
}

export function sumDomainThresholdView(view: DomainThresholdView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedExpiresAt + parsedCapacity + parsedDurationMinutes;
}
