import * as text from "../../../../kit/text.js";
import { SeasonalMentionSchedule } from "./seasonal-mention-schedule.js";

/** How screens and exports show a seasonal mention schedule. */
export class SeasonalMentionScheduleView {
  code: string;
  label: string;
  createdAt: string;
  regionText: string;
  variant: string;
  frequencyCapText: string;
  costText: string;
  category: string;
  title: string;
  localeText: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    createdAt: string,
    regionText: string,
    variant: string,
    frequencyCapText: string,
    costText: string,
    category: string,
    title: string,
    localeText: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.regionText = regionText;
    this.variant = variant;
    this.frequencyCapText = frequencyCapText;
    this.costText = costText;
    this.category = category;
    this.title = title;
    this.localeText = localeText;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalMentionScheduleView(item: SeasonalMentionSchedule): SeasonalMentionScheduleView {
  return new SeasonalMentionScheduleView(
    text.truncate(item.code, 40),
    item.label,
    String(item.createdAt),
    item.region,
    text.truncate(item.variant, 64),
    String(item.frequencyCap),
    item.cost.toFixed(2),
    item.category,
    item.title,
    item.locale,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalMentionScheduleViews(items: SeasonalMentionSchedule[]): SeasonalMentionScheduleView[] {
  const views: SeasonalMentionScheduleView[] = [];
  for (const item of items) {
    views.push(toSeasonalMentionScheduleView(item));
  }
  return views;
}

export function sumSeasonalMentionScheduleView(view: SeasonalMentionScheduleView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedCreatedAt + parsedFrequencyCap + parsedCost;
}
