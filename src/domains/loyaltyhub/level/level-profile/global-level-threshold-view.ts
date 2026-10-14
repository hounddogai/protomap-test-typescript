import * as text from "../../../../kit/text.js";
import { GlobalLevelThreshold } from "./global-level-threshold.js";

/** How screens and exports show a global level threshold. */
export class GlobalLevelThresholdView {
  code: string;
  title: string;
  startsAt: string;
  description: string;
  locale: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    startsAt: string,
    description: string,
    locale: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.description = description;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalLevelThresholdView(item: GlobalLevelThreshold): GlobalLevelThresholdView {
  return new GlobalLevelThresholdView(
    text.truncate(item.code, 64),
    item.title,
    String(item.startsAt),
    item.description,
    item.locale,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalLevelThresholdViews(items: GlobalLevelThreshold[]): GlobalLevelThresholdView[] {
  const views: GlobalLevelThresholdView[] = [];
  for (const item of items) {
    views.push(toGlobalLevelThresholdView(item));
  }
  return views;
}

export function sumGlobalLevelThresholdView(view: GlobalLevelThresholdView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
