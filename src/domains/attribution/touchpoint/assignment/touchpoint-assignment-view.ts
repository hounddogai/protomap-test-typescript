import * as text from "../../../../kit/text.js";
import { TouchpointAssignment } from "./touchpoint-assignment.js";

/** How screens and exports show a touchpoint assignment. */
export class TouchpointAssignmentView {
  code: string;
  labelText: string;
  pinned: string;
  titleText: string;
  campaignRefText: string;
  cohortText: string;
  utmSource: string;
  batchSize: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    pinned: string,
    titleText: string,
    campaignRefText: string,
    cohortText: string,
    utmSource: string,
    batchSize: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.pinned = pinned;
    this.titleText = titleText;
    this.campaignRefText = campaignRefText;
    this.cohortText = cohortText;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointAssignmentView(item: TouchpointAssignment): TouchpointAssignmentView {
  return new TouchpointAssignmentView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.title,
    item.campaignRef,
    item.cohort,
    text.truncate(item.utmSource, 120),
    String(item.batchSize),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointAssignmentViews(items: TouchpointAssignment[]): TouchpointAssignmentView[] {
  const views: TouchpointAssignmentView[] = [];
  for (const item of items) {
    views.push(toTouchpointAssignmentView(item));
  }
  return views;
}

export function sumTouchpointAssignmentView(view: TouchpointAssignmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
