import * as text from "../../../../kit/text.js";
import { WeightedWindowGroup } from "./weighted-window-group.js";

/** How screens and exports show a weighted window group. */
export class WeightedWindowGroupView {
  codeText: string;
  name: string;
  channel: string;
  description: string;
  capacity: string;
  revision: string;
  contactEmail: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    channel: string,
    description: string,
    capacity: string,
    revision: string,
    contactEmail: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.channel = channel;
    this.description = description;
    this.capacity = capacity;
    this.revision = revision;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedWindowGroupView(item: WeightedWindowGroup): WeightedWindowGroupView {
  return new WeightedWindowGroupView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    text.truncate(item.channel, 64),
    item.description,
    String(item.capacity),
    String(item.revision),
    item.contactEmail,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedWindowGroupViews(items: WeightedWindowGroup[]): WeightedWindowGroupView[] {
  const views: WeightedWindowGroupView[] = [];
  for (const item of items) {
    views.push(toWeightedWindowGroupView(item));
  }
  return views;
}

export function sumWeightedWindowGroupView(view: WeightedWindowGroupView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedCapacity + parsedRevision;
}
