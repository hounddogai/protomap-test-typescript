import * as text from "../../../../kit/text.js";
import { RollingLevelAssignment } from "./rolling-level-assignment.js";

/** How screens and exports show a rolling level assignment. */
export class RollingLevelAssignmentView {
  code: string;
  name: string;
  externalRef: string;
  margin: string;
  summaryText: string;
  labelText: string;
  maximumText: string;
  segment: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    margin: string,
    summaryText: string,
    labelText: string,
    maximumText: string,
    segment: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.margin = margin;
    this.summaryText = summaryText;
    this.labelText = labelText;
    this.maximumText = maximumText;
    this.segment = segment;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toRollingLevelAssignmentView(item: RollingLevelAssignment): RollingLevelAssignmentView {
  return new RollingLevelAssignmentView(
    item.code,
    item.name,
    item.externalRef,
    item.margin.toFixed(2),
    text.truncate(item.summary, 40),
    item.label,
    item.maximum.toFixed(2),
    text.truncate(item.segment, 120),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingLevelAssignmentViews(items: RollingLevelAssignment[]): RollingLevelAssignmentView[] {
  const views: RollingLevelAssignmentView[] = [];
  for (const item of items) {
    views.push(toRollingLevelAssignmentView(item));
  }
  return views;
}

export function sumRollingLevelAssignmentView(view: RollingLevelAssignmentView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedMargin + parsedMaximum + parsedLimit;
}
