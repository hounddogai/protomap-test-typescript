import { SeasonalLevelOverride } from "./seasonal-level-override.js";

/** How screens and exports show a seasonal level override. */
export class SeasonalLevelOverrideView {
  code: string;
  title: string;
  campaignRefText: string;
  revisionText: string;
  regionText: string;
  rate: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRefText: string,
    revisionText: string,
    regionText: string,
    rate: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRefText = campaignRefText;
    this.revisionText = revisionText;
    this.regionText = regionText;
    this.rate = rate;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalLevelOverrideView(item: SeasonalLevelOverride): SeasonalLevelOverrideView {
  return new SeasonalLevelOverrideView(
    item.code,
    item.title,
    item.campaignRef,
    String(item.revision),
    item.region,
    item.rate.toFixed(2),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalLevelOverrideViews(items: SeasonalLevelOverride[]): SeasonalLevelOverrideView[] {
  const views: SeasonalLevelOverrideView[] = [];
  for (const item of items) {
    views.push(toSeasonalLevelOverrideView(item));
  }
  return views;
}

export function sumSeasonalLevelOverrideView(view: SeasonalLevelOverrideView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRevision + parsedRate;
}
