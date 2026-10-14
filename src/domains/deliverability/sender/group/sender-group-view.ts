import * as text from "../../../../kit/text.js";
import { SenderGroup } from "./sender-group.js";

/** How screens and exports show a sender group. */
export class SenderGroupView {
  codeText: string;
  name: string;
  updatedAtText: string;
  variant: string;
  source: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    updatedAtText: string,
    variant: string,
    source: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.updatedAtText = updatedAtText;
    this.variant = variant;
    this.source = source;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toSenderGroupView(item: SenderGroup): SenderGroupView {
  return new SenderGroupView(
    text.truncate(item.code, 64),
    item.name,
    String(item.updatedAt),
    item.variant,
    item.source,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderGroupViews(items: SenderGroup[]): SenderGroupView[] {
  const views: SenderGroupView[] = [];
  for (const item of items) {
    views.push(toSenderGroupView(item));
  }
  return views;
}

export function sumSenderGroupView(view: SenderGroupView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedUpdatedAt + parsedCapacity;
}
