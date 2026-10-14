import * as text from "../../../../kit/text.js";
import { WindowAllocation } from "./window-allocation.js";

/** How screens and exports show a window allocation. */
export class WindowAllocationView {
  code: string;
  name: string;
  category: string;
  maximumText: string;
  channel: string;
  startsAt: string;
  utmSourceText: string;
  description: string;
  title: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    category: string,
    maximumText: string,
    channel: string,
    startsAt: string,
    utmSourceText: string,
    description: string,
    title: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.maximumText = maximumText;
    this.channel = channel;
    this.startsAt = startsAt;
    this.utmSourceText = utmSourceText;
    this.description = description;
    this.title = title;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toWindowAllocationView(item: WindowAllocation): WindowAllocationView {
  return new WindowAllocationView(
    item.code,
    text.truncate(item.name, 64),
    item.category,
    item.maximum.toFixed(2),
    item.channel,
    String(item.startsAt),
    item.utmSource,
    text.truncate(item.description, 80),
    item.title,
    text.truncate(item.contactEmail, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowAllocationViews(items: WindowAllocation[]): WindowAllocationView[] {
  const views: WindowAllocationView[] = [];
  for (const item of items) {
    views.push(toWindowAllocationView(item));
  }
  return views;
}

export function sumWindowAllocationView(view: WindowAllocationView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedMaximum + parsedStartsAt;
}
