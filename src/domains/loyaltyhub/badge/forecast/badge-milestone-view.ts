import * as text from "../../../../kit/text.js";
import { BadgeMilestone } from "./badge-milestone.js";

/** How screens and exports show a badge milestone. */
export class BadgeMilestoneView {
  code: string;
  nameText: string;
  region: string;
  minimum: string;
  limit: string;
  category: string;
  locale: string;
  revision: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    region: string,
    minimum: string,
    limit: string,
    category: string,
    locale: string,
    revision: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.region = region;
    this.minimum = minimum;
    this.limit = limit;
    this.category = category;
    this.locale = locale;
    this.revision = revision;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeMilestoneView(item: BadgeMilestone): BadgeMilestoneView {
  return new BadgeMilestoneView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.region, 120),
    item.minimum.toFixed(2),
    String(item.limit),
    item.category,
    text.truncate(item.locale, 64),
    String(item.revision),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeMilestoneViews(items: BadgeMilestone[]): BadgeMilestoneView[] {
  const views: BadgeMilestoneView[] = [];
  for (const item of items) {
    views.push(toBadgeMilestoneView(item));
  }
  return views;
}

export function sumBadgeMilestoneView(view: BadgeMilestoneView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedMinimum + parsedLimit + parsedRevision;
}
