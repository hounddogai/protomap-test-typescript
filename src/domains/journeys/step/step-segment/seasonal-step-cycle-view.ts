import { SeasonalStepCycle } from "./seasonal-step-cycle.js";

/** How screens and exports show a seasonal step cycle. */
export class SeasonalStepCycleView {
  code: string;
  label: string;
  impressionsText: string;
  maximum: string;
  revisionText: string;
  visible: string;
  windowDays: string;
  campaignRef: string;
  amount: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressionsText: string,
    maximum: string,
    revisionText: string,
    visible: string,
    windowDays: string,
    campaignRef: string,
    amount: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressionsText = impressionsText;
    this.maximum = maximum;
    this.revisionText = revisionText;
    this.visible = visible;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.amount = amount;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalStepCycleView(item: SeasonalStepCycle): SeasonalStepCycleView {
  return new SeasonalStepCycleView(
    item.code,
    item.label,
    String(item.impressions),
    item.maximum.toFixed(2),
    String(item.revision),
    `${item.visible}`,
    String(item.windowDays),
    item.campaignRef,
    item.amount.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalStepCycleViews(items: SeasonalStepCycle[]): SeasonalStepCycleView[] {
  const views: SeasonalStepCycleView[] = [];
  for (const item of items) {
    views.push(toSeasonalStepCycleView(item));
  }
  return views;
}

export function sumSeasonalStepCycleView(view: SeasonalStepCycleView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedImpressions + parsedMaximum + parsedRevision;
}
