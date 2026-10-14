import * as text from "../../../../kit/text.js";
import { DefaultPreferencePolicy } from "./default-preference-policy.js";

/** How screens and exports show a default preference policy. */
export class DefaultPreferencePolicyView {
  codeText: string;
  title: string;
  capacity: string;
  checksum: string;
  audienceIdText: string;
  unitText: string;
  endsAtText: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    capacity: string,
    checksum: string,
    audienceIdText: string,
    unitText: string,
    endsAtText: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.capacity = capacity;
    this.checksum = checksum;
    this.audienceIdText = audienceIdText;
    this.unitText = unitText;
    this.endsAtText = endsAtText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPreferencePolicyView(item: DefaultPreferencePolicy): DefaultPreferencePolicyView {
  return new DefaultPreferencePolicyView(
    text.truncate(item.code, 80),
    item.title,
    String(item.capacity),
    item.checksum,
    item.audienceId,
    text.truncate(item.unit, 64),
    String(item.endsAt),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPreferencePolicyViews(items: DefaultPreferencePolicy[]): DefaultPreferencePolicyView[] {
  const views: DefaultPreferencePolicyView[] = [];
  for (const item of items) {
    views.push(toDefaultPreferencePolicyView(item));
  }
  return views;
}

export function sumDefaultPreferencePolicyView(view: DefaultPreferencePolicyView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedCapacity + parsedEndsAt;
}
