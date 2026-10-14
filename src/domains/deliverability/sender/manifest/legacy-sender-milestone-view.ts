import * as text from "../../../../kit/text.js";
import { LegacySenderMilestone } from "./legacy-sender-milestone.js";

/** How screens and exports show a legacy sender milestone. */
export class LegacySenderMilestoneView {
  code: string;
  label: string;
  floorValue: string;
  margin: string;
  cohortText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    margin: string,
    cohortText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.margin = margin;
    this.cohortText = cohortText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySenderMilestoneView(item: LegacySenderMilestone): LegacySenderMilestoneView {
  return new LegacySenderMilestoneView(
    text.truncate(item.code, 120),
    item.label,
    item.floorValue.toFixed(2),
    item.margin.toFixed(2),
    text.truncate(item.cohort, 64),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySenderMilestoneViews(items: LegacySenderMilestone[]): LegacySenderMilestoneView[] {
  const views: LegacySenderMilestoneView[] = [];
  for (const item of items) {
    views.push(toLegacySenderMilestoneView(item));
  }
  return views;
}

export function sumLegacySenderMilestoneView(view: LegacySenderMilestoneView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedFloorValue + parsedMargin;
}
