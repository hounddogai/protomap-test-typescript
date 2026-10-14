import { PlacementProfile } from "./placement-profile.js";

/** How screens and exports show a placement profile. */
export class PlacementProfileView {
  code: string;
  titleText: string;
  externalRef: string;
  journeyId: string;
  approved: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    externalRef: string,
    journeyId: string,
    approved: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.approved = approved;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementProfileView(item: PlacementProfile): PlacementProfileView {
  return new PlacementProfileView(
    item.code,
    item.title,
    item.externalRef,
    item.journeyId,
    `${item.approved}`,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementProfileViews(items: PlacementProfile[]): PlacementProfileView[] {
  const views: PlacementProfileView[] = [];
  for (const item of items) {
    views.push(toPlacementProfileView(item));
  }
  return views;
}

export function sumPlacementProfileView(view: PlacementProfileView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
