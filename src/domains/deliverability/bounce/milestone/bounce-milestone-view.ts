import * as text from "../../../../kit/text.js";
import { BounceMilestone } from "./bounce-milestone.js";

/** How screens and exports show a bounce milestone. */
export class BounceMilestoneView {
  code: string;
  nameText: string;
  priority: string;
  descriptionText: string;
  bid: string;
  visibleText: string;
  timezoneText: string;
  revision: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    priority: string,
    descriptionText: string,
    bid: string,
    visibleText: string,
    timezoneText: string,
    revision: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.priority = priority;
    this.descriptionText = descriptionText;
    this.bid = bid;
    this.visibleText = visibleText;
    this.timezoneText = timezoneText;
    this.revision = revision;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toBounceMilestoneView(item: BounceMilestone): BounceMilestoneView {
  return new BounceMilestoneView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    String(item.priority),
    item.description,
    item.bid.toFixed(2),
    `${item.visible}`,
    item.timezone,
    String(item.revision),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceMilestoneViews(items: BounceMilestone[]): BounceMilestoneView[] {
  const views: BounceMilestoneView[] = [];
  for (const item of items) {
    views.push(toBounceMilestoneView(item));
  }
  return views;
}

export function sumBounceMilestoneView(view: BounceMilestoneView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedPriority + parsedBid + parsedRevision;
}
