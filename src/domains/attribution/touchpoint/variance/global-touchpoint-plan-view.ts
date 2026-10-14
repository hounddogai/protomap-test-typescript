import * as text from "../../../../kit/text.js";
import { GlobalTouchpointPlan } from "./global-touchpoint-plan.js";

/** How screens and exports show a global touchpoint plan. */
export class GlobalTouchpointPlanView {
  codeText: string;
  nameText: string;
  minimum: string;
  windowDays: string;
  batchSize: string;
  audienceIdText: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    minimum: string,
    windowDays: string,
    batchSize: string,
    audienceIdText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.audienceIdText = audienceIdText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalTouchpointPlanView(item: GlobalTouchpointPlan): GlobalTouchpointPlanView {
  return new GlobalTouchpointPlanView(
    item.code,
    text.truncate(item.name, 40),
    item.minimum.toFixed(2),
    String(item.windowDays),
    String(item.batchSize),
    item.audienceId,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalTouchpointPlanViews(items: GlobalTouchpointPlan[]): GlobalTouchpointPlanView[] {
  const views: GlobalTouchpointPlanView[] = [];
  for (const item of items) {
    views.push(toGlobalTouchpointPlanView(item));
  }
  return views;
}

export function sumGlobalTouchpointPlanView(view: GlobalTouchpointPlanView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedMinimum + parsedWindowDays + parsedBatchSize;
}
