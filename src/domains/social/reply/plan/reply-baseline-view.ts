import * as text from "../../../../kit/text.js";
import { ReplyBaseline } from "./reply-baseline.js";

/** How screens and exports show a reply baseline. */
export class ReplyBaselineView {
  code: string;
  label: string;
  revision: string;
  name: string;
  campaignRef: string;
  capacity: string;
  contactEmailText: string;
  weightText: string;
  source: string;
  cost: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    name: string,
    campaignRef: string,
    capacity: string,
    contactEmailText: string,
    weightText: string,
    source: string,
    cost: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.name = name;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.contactEmailText = contactEmailText;
    this.weightText = weightText;
    this.source = source;
    this.cost = cost;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyBaselineView(item: ReplyBaseline): ReplyBaselineView {
  return new ReplyBaselineView(
    item.code,
    item.label,
    String(item.revision),
    item.name,
    text.truncate(item.campaignRef, 64),
    String(item.capacity),
    item.contactEmail,
    item.weight.toFixed(2),
    item.source,
    item.cost.toFixed(2),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyBaselineViews(items: ReplyBaseline[]): ReplyBaselineView[] {
  const views: ReplyBaselineView[] = [];
  for (const item of items) {
    views.push(toReplyBaselineView(item));
  }
  return views;
}

export function sumReplyBaselineView(view: ReplyBaselineView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedRevision + parsedCapacity + parsedWeight;
}
