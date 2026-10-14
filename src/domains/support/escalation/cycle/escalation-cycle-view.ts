import * as text from "../../../../kit/text.js";
import { EscalationCycle } from "./escalation-cycle.js";

/** How screens and exports show a escalation cycle. */
export class EscalationCycleView {
  code: string;
  label: string;
  localeText: string;
  openRate: string;
  floorValue: string;
  margin: string;
  summary: string;
  limitText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    openRate: string,
    floorValue: string,
    margin: string,
    summary: string,
    limitText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.openRate = openRate;
    this.floorValue = floorValue;
    this.margin = margin;
    this.summary = summary;
    this.limitText = limitText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationCycleView(item: EscalationCycle): EscalationCycleView {
  return new EscalationCycleView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.locale, 40),
    item.openRate.toFixed(2),
    item.floorValue.toFixed(2),
    item.margin.toFixed(2),
    item.summary,
    String(item.limit),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationCycleViews(items: EscalationCycle[]): EscalationCycleView[] {
  const views: EscalationCycleView[] = [];
  for (const item of items) {
    views.push(toEscalationCycleView(item));
  }
  return views;
}

export function sumEscalationCycleView(view: EscalationCycleView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedOpenRate + parsedFloorValue + parsedMargin;
}
