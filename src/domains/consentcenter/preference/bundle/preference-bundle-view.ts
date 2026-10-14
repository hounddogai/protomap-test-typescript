import { PreferenceBundle } from "./preference-bundle.js";

/** How screens and exports show a preference bundle. */
export class PreferenceBundleView {
  code: string;
  label: string;
  openRate: string;
  budget: string;
  thresholdText: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRate: string,
    budget: string,
    thresholdText: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.budget = budget;
    this.thresholdText = thresholdText;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceBundleView(item: PreferenceBundle): PreferenceBundleView {
  return new PreferenceBundleView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    item.threshold.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceBundleViews(items: PreferenceBundle[]): PreferenceBundleView[] {
  const views: PreferenceBundleView[] = [];
  for (const item of items) {
    views.push(toPreferenceBundleView(item));
  }
  return views;
}

export function sumPreferenceBundleView(view: PreferenceBundleView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedOpenRate + parsedBudget + parsedThreshold;
}
