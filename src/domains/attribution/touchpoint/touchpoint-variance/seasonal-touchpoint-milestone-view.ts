import * as text from "../../../../kit/text.js";
import { SeasonalTouchpointMilestone } from "./seasonal-touchpoint-milestone.js";

/** How screens and exports show a seasonal touchpoint milestone. */
export class SeasonalTouchpointMilestoneView {
  code: string;
  title: string;
  sourceText: string;
  descriptionText: string;
  segment: string;
  locale: string;
  contactEmail: string;
  endsAtText: string;
  createdAtText: string;
  name: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sourceText: string,
    descriptionText: string,
    segment: string,
    locale: string,
    contactEmail: string,
    endsAtText: string,
    createdAtText: string,
    name: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sourceText = sourceText;
    this.descriptionText = descriptionText;
    this.segment = segment;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.endsAtText = endsAtText;
    this.createdAtText = createdAtText;
    this.name = name;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalTouchpointMilestoneView(item: SeasonalTouchpointMilestone): SeasonalTouchpointMilestoneView {
  return new SeasonalTouchpointMilestoneView(
    item.code,
    item.title,
    text.truncate(item.source, 80),
    text.truncate(item.description, 40),
    item.segment,
    text.truncate(item.locale, 64),
    text.truncate(item.contactEmail, 80),
    String(item.endsAt),
    String(item.createdAt),
    item.name,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalTouchpointMilestoneViews(items: SeasonalTouchpointMilestone[]): SeasonalTouchpointMilestoneView[] {
  const views: SeasonalTouchpointMilestoneView[] = [];
  for (const item of items) {
    views.push(toSeasonalTouchpointMilestoneView(item));
  }
  return views;
}

export function sumSeasonalTouchpointMilestoneView(view: SeasonalTouchpointMilestoneView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedEndsAt + parsedCreatedAt + parsedFloorValue;
}
