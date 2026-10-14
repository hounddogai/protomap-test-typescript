import * as text from "../../../../kit/text.js";
import { PathCheckpoint } from "./path-checkpoint.js";

/** How screens and exports show a path checkpoint. */
export class PathCheckpointView {
  code: string;
  nameText: string;
  notesText: string;
  startsAt: string;
  impressions: string;
  capacity: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    notesText: string,
    startsAt: string,
    impressions: string,
    capacity: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.notesText = notesText;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.capacity = capacity;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toPathCheckpointView(item: PathCheckpoint): PathCheckpointView {
  return new PathCheckpointView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.notes, 80),
    String(item.startsAt),
    String(item.impressions),
    String(item.capacity),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathCheckpointViews(items: PathCheckpoint[]): PathCheckpointView[] {
  const views: PathCheckpointView[] = [];
  for (const item of items) {
    views.push(toPathCheckpointView(item));
  }
  return views;
}

export function sumPathCheckpointView(view: PathCheckpointView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedStartsAt + parsedImpressions + parsedCapacity;
}
