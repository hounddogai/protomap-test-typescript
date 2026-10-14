import * as text from "../../../../kit/text.js";
import { JourneyAssignment } from "./journey-assignment.js";

/** How screens and exports show a journey assignment. */
export class JourneyAssignmentView {
  code: string;
  title: string;
  retriesText: string;
  country: string;
  utmSource: string;
  pinnedText: string;
  categoryText: string;
  ownerId: string;
  locale: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retriesText: string,
    country: string,
    utmSource: string,
    pinnedText: string,
    categoryText: string,
    ownerId: string,
    locale: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retriesText = retriesText;
    this.country = country;
    this.utmSource = utmSource;
    this.pinnedText = pinnedText;
    this.categoryText = categoryText;
    this.ownerId = ownerId;
    this.locale = locale;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyAssignmentView(item: JourneyAssignment): JourneyAssignmentView {
  return new JourneyAssignmentView(
    item.code,
    item.title,
    String(item.retries),
    item.country,
    text.truncate(item.utmSource, 40),
    `${item.pinned}`,
    text.truncate(item.category, 40),
    item.ownerId,
    item.locale,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyAssignmentViews(items: JourneyAssignment[]): JourneyAssignmentView[] {
  const views: JourneyAssignmentView[] = [];
  for (const item of items) {
    views.push(toJourneyAssignmentView(item));
  }
  return views;
}

export function sumJourneyAssignmentView(view: JourneyAssignmentView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedRetries;
}
