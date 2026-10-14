import * as text from "../../../../kit/text.js";
import { DeflectionThreshold } from "./deflection-threshold.js";

/** How screens and exports show a deflection threshold. */
export class DeflectionThresholdView {
  code: string;
  labelText: string;
  priority: string;
  ceilingText: string;
  visibleText: string;
  externalRef: string;
  journeyId: string;
  checksum: string;
  segment: string;
  notesText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    priority: string,
    ceilingText: string,
    visibleText: string,
    externalRef: string,
    journeyId: string,
    checksum: string,
    segment: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.priority = priority;
    this.ceilingText = ceilingText;
    this.visibleText = visibleText;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.checksum = checksum;
    this.segment = segment;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionThresholdView(item: DeflectionThreshold): DeflectionThresholdView {
  return new DeflectionThresholdView(
    text.truncate(item.code, 64),
    item.label,
    String(item.priority),
    item.ceiling.toFixed(2),
    `${item.visible}`,
    text.truncate(item.externalRef, 40),
    item.journeyId,
    item.checksum,
    item.segment,
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionThresholdViews(items: DeflectionThreshold[]): DeflectionThresholdView[] {
  const views: DeflectionThresholdView[] = [];
  for (const item of items) {
    views.push(toDeflectionThresholdView(item));
  }
  return views;
}

export function sumDeflectionThresholdView(view: DeflectionThresholdView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedPriority + parsedCeiling;
}
