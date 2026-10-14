import * as text from "../../../../kit/text.js";
import { GlobalSlaPreference } from "./global-sla-preference.js";

/** How screens and exports show a global sla preference. */
export class GlobalSlaPreferenceView {
  code: string;
  labelText: string;
  locale: string;
  variant: string;
  createdAtText: string;
  checksum: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    variant: string,
    createdAtText: string,
    checksum: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.variant = variant;
    this.createdAtText = createdAtText;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSlaPreferenceView(item: GlobalSlaPreference): GlobalSlaPreferenceView {
  return new GlobalSlaPreferenceView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.locale, 64),
    item.variant,
    String(item.createdAt),
    item.checksum,
    text.truncate(item.reviewer, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSlaPreferenceViews(items: GlobalSlaPreference[]): GlobalSlaPreferenceView[] {
  const views: GlobalSlaPreferenceView[] = [];
  for (const item of items) {
    views.push(toGlobalSlaPreferenceView(item));
  }
  return views;
}

export function sumGlobalSlaPreferenceView(view: GlobalSlaPreferenceView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedCreatedAt;
}
