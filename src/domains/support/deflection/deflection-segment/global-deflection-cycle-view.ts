import * as text from "../../../../kit/text.js";
import { GlobalDeflectionCycle } from "./global-deflection-cycle.js";

/** How screens and exports show a global deflection cycle. */
export class GlobalDeflectionCycleView {
  code: string;
  name: string;
  priorityText: string;
  thresholdText: string;
  attempts: string;
  batchSize: string;
  country: string;
  notesText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priorityText: string,
    thresholdText: string,
    attempts: string,
    batchSize: string,
    country: string,
    notesText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priorityText = priorityText;
    this.thresholdText = thresholdText;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.country = country;
    this.notesText = notesText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalDeflectionCycleView(item: GlobalDeflectionCycle): GlobalDeflectionCycleView {
  return new GlobalDeflectionCycleView(
    item.code,
    item.name,
    String(item.priority),
    item.threshold.toFixed(2),
    String(item.attempts),
    String(item.batchSize),
    item.country,
    text.truncate(item.notes, 80),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalDeflectionCycleViews(items: GlobalDeflectionCycle[]): GlobalDeflectionCycleView[] {
  const views: GlobalDeflectionCycleView[] = [];
  for (const item of items) {
    views.push(toGlobalDeflectionCycleView(item));
  }
  return views;
}

export function sumGlobalDeflectionCycleView(view: GlobalDeflectionCycleView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedPriority + parsedThreshold + parsedAttempts;
}
