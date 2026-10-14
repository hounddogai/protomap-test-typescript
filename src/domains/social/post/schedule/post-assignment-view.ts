import * as text from "../../../../kit/text.js";
import { PostAssignment } from "./post-assignment.js";

/** How screens and exports show a post assignment. */
export class PostAssignmentView {
  code: string;
  titleText: string;
  startsAt: string;
  country: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    startsAt: string,
    country: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.startsAt = startsAt;
    this.country = country;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toPostAssignmentView(item: PostAssignment): PostAssignmentView {
  return new PostAssignmentView(
    text.truncate(item.code, 120),
    item.title,
    String(item.startsAt),
    text.truncate(item.country, 64),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostAssignmentViews(items: PostAssignment[]): PostAssignmentView[] {
  const views: PostAssignmentView[] = [];
  for (const item of items) {
    views.push(toPostAssignmentView(item));
  }
  return views;
}

export function sumPostAssignmentView(view: PostAssignmentView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedStartsAt + parsedThreshold;
}
