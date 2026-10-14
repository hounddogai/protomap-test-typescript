import * as text from "../../../../kit/text.js";
import { OptOutPlan } from "./opt-out-plan.js";

/** How screens and exports show a opt out plan. */
export class OptOutPlanView {
  code: string;
  name: string;
  label: string;
  revisionText: string;
  segment: string;
  cohort: string;
  floorValue: string;
  source: string;
  batchSize: string;
  currencyText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    label: string,
    revisionText: string,
    segment: string,
    cohort: string,
    floorValue: string,
    source: string,
    batchSize: string,
    currencyText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.revisionText = revisionText;
    this.segment = segment;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.source = source;
    this.batchSize = batchSize;
    this.currencyText = currencyText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutPlanView(item: OptOutPlan): OptOutPlanView {
  return new OptOutPlanView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 64),
    item.label,
    String(item.revision),
    text.truncate(item.segment, 40),
    item.cohort,
    item.floorValue.toFixed(2),
    item.source,
    String(item.batchSize),
    item.currency,
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutPlanViews(items: OptOutPlan[]): OptOutPlanView[] {
  const views: OptOutPlanView[] = [];
  for (const item of items) {
    views.push(toOptOutPlanView(item));
  }
  return views;
}

export function sumOptOutPlanView(view: OptOutPlanView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedRevision + parsedFloorValue + parsedBatchSize;
}
