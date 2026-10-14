import * as text from "../../../../kit/text.js";
import { RedemptionAssignment } from "./redemption-assignment.js";

/** How screens and exports show a redemption assignment. */
export class RedemptionAssignmentView {
  code: string;
  nameText: string;
  reviewerText: string;
  audienceId: string;
  floorValue: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    reviewerText: string,
    audienceId: string,
    floorValue: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.reviewerText = reviewerText;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionAssignmentView(item: RedemptionAssignment): RedemptionAssignmentView {
  return new RedemptionAssignmentView(
    item.code,
    text.truncate(item.name, 64),
    text.truncate(item.reviewer, 80),
    text.truncate(item.audienceId, 120),
    item.floorValue.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionAssignmentViews(items: RedemptionAssignment[]): RedemptionAssignmentView[] {
  const views: RedemptionAssignmentView[] = [];
  for (const item of items) {
    views.push(toRedemptionAssignmentView(item));
  }
  return views;
}

export function sumRedemptionAssignmentView(view: RedemptionAssignmentView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedFloorValue + parsedUpdatedAt;
}
