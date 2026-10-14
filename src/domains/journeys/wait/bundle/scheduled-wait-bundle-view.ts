import * as text from "../../../../kit/text.js";
import { ScheduledWaitBundle } from "./scheduled-wait-bundle.js";

/** How screens and exports show a scheduled wait bundle. */
export class ScheduledWaitBundleView {
  code: string;
  title: string;
  endsAt: string;
  descriptionText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    descriptionText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.descriptionText = descriptionText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledWaitBundleView(item: ScheduledWaitBundle): ScheduledWaitBundleView {
  return new ScheduledWaitBundleView(
    item.code,
    text.truncate(item.title, 80),
    String(item.endsAt),
    item.description,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledWaitBundleViews(items: ScheduledWaitBundle[]): ScheduledWaitBundleView[] {
  const views: ScheduledWaitBundleView[] = [];
  for (const item of items) {
    views.push(toScheduledWaitBundleView(item));
  }
  return views;
}

export function sumScheduledWaitBundleView(view: ScheduledWaitBundleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedEndsAt;
}
