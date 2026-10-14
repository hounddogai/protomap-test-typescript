import { LevelProfile } from "./level-profile.js";

/** How screens and exports show a level profile. */
export class LevelProfileView {
  code: string;
  title: string;
  source: string;
  phoneText: string;
  durationMinutesText: string;
  ratio: string;
  archivedText: string;
  ceilingText: string;
  currency: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    source: string,
    phoneText: string,
    durationMinutesText: string,
    ratio: string,
    archivedText: string,
    ceilingText: string,
    currency: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.phoneText = phoneText;
    this.durationMinutesText = durationMinutesText;
    this.ratio = ratio;
    this.archivedText = archivedText;
    this.ceilingText = ceilingText;
    this.currency = currency;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toLevelProfileView(item: LevelProfile): LevelProfileView {
  return new LevelProfileView(
    item.code,
    item.title,
    item.source,
    item.phone,
    String(item.durationMinutes),
    item.ratio.toFixed(2),
    `${item.archived}`,
    item.ceiling.toFixed(2),
    item.currency,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelProfileViews(items: LevelProfile[]): LevelProfileView[] {
  const views: LevelProfileView[] = [];
  for (const item of items) {
    views.push(toLevelProfileView(item));
  }
  return views;
}

export function sumLevelProfileView(view: LevelProfileView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedDurationMinutes + parsedRatio + parsedCeiling;
}
