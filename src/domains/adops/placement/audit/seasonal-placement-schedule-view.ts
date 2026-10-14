import * as text from "../../../../kit/text.js";
import { SeasonalPlacementSchedule } from "./seasonal-placement-schedule.js";

/** How screens and exports show a seasonal placement schedule. */
export class SeasonalPlacementScheduleView {
  code: string;
  title: string;
  revisionText: string;
  phone: string;
  visible: string;
  descriptionText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revisionText: string,
    phone: string,
    visible: string,
    descriptionText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revisionText = revisionText;
    this.phone = phone;
    this.visible = visible;
    this.descriptionText = descriptionText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPlacementScheduleView(item: SeasonalPlacementSchedule): SeasonalPlacementScheduleView {
  return new SeasonalPlacementScheduleView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    String(item.revision),
    text.truncate(item.phone, 80),
    `${item.visible}`,
    item.description,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPlacementScheduleViews(items: SeasonalPlacementSchedule[]): SeasonalPlacementScheduleView[] {
  const views: SeasonalPlacementScheduleView[] = [];
  for (const item of items) {
    views.push(toSeasonalPlacementScheduleView(item));
  }
  return views;
}

export function sumSeasonalPlacementScheduleView(view: SeasonalPlacementScheduleView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedRevision + parsedVersion;
}
