import { LenientApprovalForecast } from "./lenient-approval-forecast.js";

/** How screens and exports show a lenient approval forecast. */
export class LenientApprovalForecastView {
  code: string;
  name: string;
  priority: string;
  impressionsText: string;
  journeyIdText: string;
  floorValueText: string;
  sendAtText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priority: string,
    impressionsText: string,
    journeyIdText: string,
    floorValueText: string,
    sendAtText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.impressionsText = impressionsText;
    this.journeyIdText = journeyIdText;
    this.floorValueText = floorValueText;
    this.sendAtText = sendAtText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toLenientApprovalForecastView(item: LenientApprovalForecast): LenientApprovalForecastView {
  return new LenientApprovalForecastView(
    item.code,
    item.name,
    String(item.priority),
    String(item.impressions),
    item.journeyId,
    item.floorValue.toFixed(2),
    String(item.sendAt),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientApprovalForecastViews(items: LenientApprovalForecast[]): LenientApprovalForecastView[] {
  const views: LenientApprovalForecastView[] = [];
  for (const item of items) {
    views.push(toLenientApprovalForecastView(item));
  }
  return views;
}

export function sumLenientApprovalForecastView(view: LenientApprovalForecastView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedPriority + parsedImpressions + parsedFloorValue;
}
