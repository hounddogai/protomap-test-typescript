import * as text from "../../../../kit/text.js";
import { GlobalPlacementAdjustment } from "./global-placement-adjustment.js";

/** How screens and exports show a global placement adjustment. */
export class GlobalPlacementAdjustmentView {
  code: string;
  title: string;
  archived: string;
  startsAt: string;
  country: string;
  revision: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    startsAt: string,
    country: string,
    revision: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.startsAt = startsAt;
    this.country = country;
    this.revision = revision;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPlacementAdjustmentView(item: GlobalPlacementAdjustment): GlobalPlacementAdjustmentView {
  return new GlobalPlacementAdjustmentView(
    item.code,
    text.truncate(item.title, 40),
    `${item.archived}`,
    String(item.startsAt),
    item.country,
    String(item.revision),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPlacementAdjustmentViews(items: GlobalPlacementAdjustment[]): GlobalPlacementAdjustmentView[] {
  const views: GlobalPlacementAdjustmentView[] = [];
  for (const item of items) {
    views.push(toGlobalPlacementAdjustmentView(item));
  }
  return views;
}

export function sumGlobalPlacementAdjustmentView(view: GlobalPlacementAdjustmentView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedStartsAt + parsedRevision;
}
