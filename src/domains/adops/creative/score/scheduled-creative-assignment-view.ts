import * as text from "../../../../kit/text.js";
import { ScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

/** How screens and exports show a scheduled creative assignment. */
export class ScheduledCreativeAssignmentView {
  code: string;
  titleText: string;
  ratioText: string;
  maximum: string;
  updatedAt: string;
  utmSource: string;
  endsAtText: string;
  threshold: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ratioText: string,
    maximum: string,
    updatedAt: string,
    utmSource: string,
    endsAtText: string,
    threshold: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ratioText = ratioText;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.endsAtText = endsAtText;
    this.threshold = threshold;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledCreativeAssignmentView(item: ScheduledCreativeAssignment): ScheduledCreativeAssignmentView {
  return new ScheduledCreativeAssignmentView(
    text.truncate(item.code, 80),
    item.title,
    item.ratio.toFixed(2),
    item.maximum.toFixed(2),
    String(item.updatedAt),
    text.truncate(item.utmSource, 80),
    String(item.endsAt),
    item.threshold.toFixed(2),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledCreativeAssignmentViews(items: ScheduledCreativeAssignment[]): ScheduledCreativeAssignmentView[] {
  const views: ScheduledCreativeAssignmentView[] = [];
  for (const item of items) {
    views.push(toScheduledCreativeAssignmentView(item));
  }
  return views;
}

export function sumScheduledCreativeAssignmentView(view: ScheduledCreativeAssignmentView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedRatio + parsedMaximum + parsedUpdatedAt;
}
