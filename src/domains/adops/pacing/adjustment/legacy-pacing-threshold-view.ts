import { LegacyPacingThreshold } from "./legacy-pacing-threshold.js";

/** How screens and exports show a legacy pacing threshold. */
export class LegacyPacingThresholdView {
  code: string;
  name: string;
  region: string;
  ceilingText: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    region: string,
    ceilingText: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.ceilingText = ceilingText;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPacingThresholdView(item: LegacyPacingThreshold): LegacyPacingThresholdView {
  return new LegacyPacingThresholdView(
    item.code,
    item.name,
    item.region,
    item.ceiling.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPacingThresholdViews(items: LegacyPacingThreshold[]): LegacyPacingThresholdView[] {
  const views: LegacyPacingThresholdView[] = [];
  for (const item of items) {
    views.push(toLegacyPacingThresholdView(item));
  }
  return views;
}

export function sumLegacyPacingThresholdView(view: LegacyPacingThresholdView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedCeiling + parsedRate;
}
