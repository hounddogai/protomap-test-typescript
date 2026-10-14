import * as text from "../../../../kit/text.js";
import { LenientTouchpointBudget } from "./lenient-touchpoint-budget.js";

/** How screens and exports show a lenient touchpoint budget. */
export class LenientTouchpointBudgetView {
  code: string;
  label: string;
  impressions: string;
  phoneText: string;
  batchSize: string;
  durationMinutesText: string;
  visible: string;
  sourceText: string;
  segment: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    phoneText: string,
    batchSize: string,
    durationMinutesText: string,
    visible: string,
    sourceText: string,
    segment: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.phoneText = phoneText;
    this.batchSize = batchSize;
    this.durationMinutesText = durationMinutesText;
    this.visible = visible;
    this.sourceText = sourceText;
    this.segment = segment;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTouchpointBudgetView(item: LenientTouchpointBudget): LenientTouchpointBudgetView {
  return new LenientTouchpointBudgetView(
    text.truncate(item.code, 64),
    item.label,
    String(item.impressions),
    item.phone,
    String(item.batchSize),
    String(item.durationMinutes),
    `${item.visible}`,
    item.source,
    text.truncate(item.segment, 80),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTouchpointBudgetViews(items: LenientTouchpointBudget[]): LenientTouchpointBudgetView[] {
  const views: LenientTouchpointBudgetView[] = [];
  for (const item of items) {
    views.push(toLenientTouchpointBudgetView(item));
  }
  return views;
}

export function sumLenientTouchpointBudgetView(view: LenientTouchpointBudgetView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedImpressions + parsedBatchSize + parsedDurationMinutes;
}
