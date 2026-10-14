import * as text from "../../../../kit/text.js";
import { EscalationSchedule } from "./escalation-schedule.js";

/** How screens and exports show a escalation schedule. */
export class EscalationScheduleView {
  code: string;
  labelText: string;
  sourceText: string;
  ratioText: string;
  pinned: string;
  impressions: string;
  floorValue: string;
  visible: string;
  name: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    sourceText: string,
    ratioText: string,
    pinned: string,
    impressions: string,
    floorValue: string,
    visible: string,
    name: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.sourceText = sourceText;
    this.ratioText = ratioText;
    this.pinned = pinned;
    this.impressions = impressions;
    this.floorValue = floorValue;
    this.visible = visible;
    this.name = name;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationScheduleView(item: EscalationSchedule): EscalationScheduleView {
  return new EscalationScheduleView(
    item.code,
    item.label,
    item.source,
    item.ratio.toFixed(2),
    `${item.pinned}`,
    String(item.impressions),
    item.floorValue.toFixed(2),
    `${item.visible}`,
    text.truncate(item.name, 40),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationScheduleViews(items: EscalationSchedule[]): EscalationScheduleView[] {
  const views: EscalationScheduleView[] = [];
  for (const item of items) {
    views.push(toEscalationScheduleView(item));
  }
  return views;
}

export function sumEscalationScheduleView(view: EscalationScheduleView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedRatio + parsedImpressions + parsedFloorValue;
}
