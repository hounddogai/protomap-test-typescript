import * as text from "../../../../kit/text.js";
import { PacingMapping } from "./pacing-mapping.js";

/** How screens and exports show a pacing mapping. */
export class PacingMappingView {
  codeText: string;
  label: string;
  priority: string;
  active: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    active: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.active = active;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toPacingMappingView(item: PacingMapping): PacingMappingView {
  return new PacingMappingView(
    text.truncate(item.code, 64),
    item.label,
    String(item.priority),
    `${item.active}`,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingMappingViews(items: PacingMapping[]): PacingMappingView[] {
  const views: PacingMappingView[] = [];
  for (const item of items) {
    views.push(toPacingMappingView(item));
  }
  return views;
}

export function sumPacingMappingView(view: PacingMappingView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
