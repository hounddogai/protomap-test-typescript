import * as text from "../../../../kit/text.js";
import { GlobalComplaintCycle } from "./global-complaint-cycle.js";

/** How screens and exports show a global complaint cycle. */
export class GlobalComplaintCycleView {
  code: string;
  nameText: string;
  impressions: string;
  rateText: string;
  retries: string;
  journeyId: string;
  cost: string;
  durationMinutesText: string;
  priority: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    impressions: string,
    rateText: string,
    retries: string,
    journeyId: string,
    cost: string,
    durationMinutesText: string,
    priority: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.impressions = impressions;
    this.rateText = rateText;
    this.retries = retries;
    this.journeyId = journeyId;
    this.cost = cost;
    this.durationMinutesText = durationMinutesText;
    this.priority = priority;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalComplaintCycleView(item: GlobalComplaintCycle): GlobalComplaintCycleView {
  return new GlobalComplaintCycleView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    String(item.impressions),
    item.rate.toFixed(2),
    String(item.retries),
    item.journeyId,
    item.cost.toFixed(2),
    String(item.durationMinutes),
    String(item.priority),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalComplaintCycleViews(items: GlobalComplaintCycle[]): GlobalComplaintCycleView[] {
  const views: GlobalComplaintCycleView[] = [];
  for (const item of items) {
    views.push(toGlobalComplaintCycleView(item));
  }
  return views;
}

export function sumGlobalComplaintCycleView(view: GlobalComplaintCycleView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedImpressions + parsedRate + parsedRetries;
}
