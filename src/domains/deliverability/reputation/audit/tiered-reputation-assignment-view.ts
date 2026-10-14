import * as text from "../../../../kit/text.js";
import { TieredReputationAssignment } from "./tiered-reputation-assignment.js";

/** How screens and exports show a tiered reputation assignment. */
export class TieredReputationAssignmentView {
  code: string;
  label: string;
  durationMinutes: string;
  startsAtText: string;
  externalRef: string;
  endsAt: string;
  active: string;
  region: string;
  capacity: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    durationMinutes: string,
    startsAtText: string,
    externalRef: string,
    endsAt: string,
    active: string,
    region: string,
    capacity: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.startsAtText = startsAtText;
    this.externalRef = externalRef;
    this.endsAt = endsAt;
    this.active = active;
    this.region = region;
    this.capacity = capacity;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredReputationAssignmentView(item: TieredReputationAssignment): TieredReputationAssignmentView {
  return new TieredReputationAssignmentView(
    item.code,
    text.truncate(item.label, 40),
    String(item.durationMinutes),
    String(item.startsAt),
    item.externalRef,
    String(item.endsAt),
    `${item.active}`,
    text.truncate(item.region, 120),
    String(item.capacity),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredReputationAssignmentViews(items: TieredReputationAssignment[]): TieredReputationAssignmentView[] {
  const views: TieredReputationAssignmentView[] = [];
  for (const item of items) {
    views.push(toTieredReputationAssignmentView(item));
  }
  return views;
}

export function sumTieredReputationAssignmentView(view: TieredReputationAssignmentView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedDurationMinutes + parsedStartsAt + parsedEndsAt;
}
