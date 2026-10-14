import { BatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

/** How screens and exports show a batched touchpoint preference. */
export class BatchedTouchpointPreferenceView {
  code: string;
  labelText: string;
  startsAt: string;
  conversionRateText: string;
  updatedAt: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    startsAt: string,
    conversionRateText: string,
    updatedAt: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.startsAt = startsAt;
    this.conversionRateText = conversionRateText;
    this.updatedAt = updatedAt;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedTouchpointPreferenceView(item: BatchedTouchpointPreference): BatchedTouchpointPreferenceView {
  return new BatchedTouchpointPreferenceView(
    item.code,
    item.label,
    String(item.startsAt),
    item.conversionRate.toFixed(2),
    String(item.updatedAt),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedTouchpointPreferenceViews(items: BatchedTouchpointPreference[]): BatchedTouchpointPreferenceView[] {
  const views: BatchedTouchpointPreferenceView[] = [];
  for (const item of items) {
    views.push(toBatchedTouchpointPreferenceView(item));
  }
  return views;
}

export function sumBatchedTouchpointPreferenceView(view: BatchedTouchpointPreferenceView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedStartsAt + parsedConversionRate + parsedUpdatedAt;
}
