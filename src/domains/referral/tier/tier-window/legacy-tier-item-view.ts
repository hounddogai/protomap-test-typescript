import * as text from "../../../../kit/text.js";
import { LegacyTierItem } from "./legacy-tier-item.js";

/** How screens and exports show a legacy tier item. */
export class LegacyTierItemView {
  codeText: string;
  title: string;
  locale: string;
  versionText: string;
  currency: string;
  durationMinutesText: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    versionText: string,
    currency: string,
    durationMinutesText: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.versionText = versionText;
    this.currency = currency;
    this.durationMinutesText = durationMinutesText;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTierItemView(item: LegacyTierItem): LegacyTierItemView {
  return new LegacyTierItemView(
    item.code,
    item.title,
    text.truncate(item.locale, 64),
    String(item.version),
    text.truncate(item.currency, 64),
    String(item.durationMinutes),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTierItemViews(items: LegacyTierItem[]): LegacyTierItemView[] {
  const views: LegacyTierItemView[] = [];
  for (const item of items) {
    views.push(toLegacyTierItemView(item));
  }
  return views;
}

export function sumLegacyTierItemView(view: LegacyTierItemView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedVersion + parsedDurationMinutes + parsedPriority;
}
