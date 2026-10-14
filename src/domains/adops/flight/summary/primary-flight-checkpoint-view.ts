import * as text from "../../../../kit/text.js";
import { PrimaryFlightCheckpoint } from "./primary-flight-checkpoint.js";

/** How screens and exports show a primary flight checkpoint. */
export class PrimaryFlightCheckpointView {
  code: string;
  name: string;
  floorValue: string;
  maximumText: string;
  score: string;
  channel: string;
  audienceId: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    maximumText: string,
    score: string,
    channel: string,
    audienceId: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.maximumText = maximumText;
    this.score = score;
    this.channel = channel;
    this.audienceId = audienceId;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFlightCheckpointView(item: PrimaryFlightCheckpoint): PrimaryFlightCheckpointView {
  return new PrimaryFlightCheckpointView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    item.maximum.toFixed(2),
    item.score.toFixed(2),
    item.channel,
    text.truncate(item.audienceId, 80),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFlightCheckpointViews(items: PrimaryFlightCheckpoint[]): PrimaryFlightCheckpointView[] {
  const views: PrimaryFlightCheckpointView[] = [];
  for (const item of items) {
    views.push(toPrimaryFlightCheckpointView(item));
  }
  return views;
}

export function sumPrimaryFlightCheckpointView(view: PrimaryFlightCheckpointView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedFloorValue + parsedMaximum + parsedScore;
}
