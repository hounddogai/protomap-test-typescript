import { SeasonalPlacementPreference } from "./seasonal-placement-preference.js";

/** How screens and exports show a seasonal placement preference. */
export class SeasonalPlacementPreferenceView {
  codeText: string;
  title: string;
  rate: string;
  descriptionText: string;
  priority: string;
  checksum: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    rate: string,
    descriptionText: string,
    priority: string,
    checksum: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.rate = rate;
    this.descriptionText = descriptionText;
    this.priority = priority;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPlacementPreferenceView(item: SeasonalPlacementPreference): SeasonalPlacementPreferenceView {
  return new SeasonalPlacementPreferenceView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    item.description,
    String(item.priority),
    item.checksum,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPlacementPreferenceViews(items: SeasonalPlacementPreference[]): SeasonalPlacementPreferenceView[] {
  const views: SeasonalPlacementPreferenceView[] = [];
  for (const item of items) {
    views.push(toSeasonalPlacementPreferenceView(item));
  }
  return views;
}

export function sumSeasonalPlacementPreferenceView(view: SeasonalPlacementPreferenceView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedRate + parsedPriority;
}
