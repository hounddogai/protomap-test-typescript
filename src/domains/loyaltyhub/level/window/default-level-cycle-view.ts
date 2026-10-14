import * as text from "../../../../kit/text.js";
import { DefaultLevelCycle } from "./default-level-cycle.js";

/** How screens and exports show a default level cycle. */
export class DefaultLevelCycleView {
  code: string;
  name: string;
  priorityText: string;
  checksumText: string;
  externalRefText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priorityText: string,
    checksumText: string,
    externalRefText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priorityText = priorityText;
    this.checksumText = checksumText;
    this.externalRefText = externalRefText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultLevelCycleView(item: DefaultLevelCycle): DefaultLevelCycleView {
  return new DefaultLevelCycleView(
    item.code,
    text.truncate(item.name, 64),
    String(item.priority),
    item.checksum,
    item.externalRef,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultLevelCycleViews(items: DefaultLevelCycle[]): DefaultLevelCycleView[] {
  const views: DefaultLevelCycleView[] = [];
  for (const item of items) {
    views.push(toDefaultLevelCycleView(item));
  }
  return views;
}

export function sumDefaultLevelCycleView(view: DefaultLevelCycleView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedPriority + parsedRatio;
}
