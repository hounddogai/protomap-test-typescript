import * as text from "../../../../kit/text.js";
import { RollingJourneyAssignment } from "./rolling-journey-assignment.js";

/** How screens and exports show a rolling journey assignment. */
export class RollingJourneyAssignmentView {
  code: string;
  title: string;
  descriptionText: string;
  startsAtText: string;
  revision: string;
  externalRefText: string;
  cost: string;
  maximum: string;
  locale: string;
  limit: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    descriptionText: string,
    startsAtText: string,
    revision: string,
    externalRefText: string,
    cost: string,
    maximum: string,
    locale: string,
    limit: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.descriptionText = descriptionText;
    this.startsAtText = startsAtText;
    this.revision = revision;
    this.externalRefText = externalRefText;
    this.cost = cost;
    this.maximum = maximum;
    this.locale = locale;
    this.limit = limit;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toRollingJourneyAssignmentView(item: RollingJourneyAssignment): RollingJourneyAssignmentView {
  return new RollingJourneyAssignmentView(
    item.code,
    text.truncate(item.title, 64),
    item.description,
    String(item.startsAt),
    String(item.revision),
    text.truncate(item.externalRef, 80),
    item.cost.toFixed(2),
    item.maximum.toFixed(2),
    item.locale,
    String(item.limit),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingJourneyAssignmentViews(items: RollingJourneyAssignment[]): RollingJourneyAssignmentView[] {
  const views: RollingJourneyAssignmentView[] = [];
  for (const item of items) {
    views.push(toRollingJourneyAssignmentView(item));
  }
  return views;
}

export function sumRollingJourneyAssignmentView(view: RollingJourneyAssignmentView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedStartsAt + parsedRevision + parsedCost;
}
