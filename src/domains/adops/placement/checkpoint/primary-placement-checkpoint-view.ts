import * as text from "../../../../kit/text.js";
import { PrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

/** How screens and exports show a primary placement checkpoint. */
export class PrimaryPlacementCheckpointView {
  codeText: string;
  title: string;
  pinned: string;
  revision: string;
  floorValueText: string;
  variant: string;
  attempts: string;
  clicks: string;
  currency: string;
  unitText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    pinned: string,
    revision: string,
    floorValueText: string,
    variant: string,
    attempts: string,
    clicks: string,
    currency: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.pinned = pinned;
    this.revision = revision;
    this.floorValueText = floorValueText;
    this.variant = variant;
    this.attempts = attempts;
    this.clicks = clicks;
    this.currency = currency;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPlacementCheckpointView(item: PrimaryPlacementCheckpoint): PrimaryPlacementCheckpointView {
  return new PrimaryPlacementCheckpointView(
    item.code,
    text.truncate(item.title, 40),
    `${item.pinned}`,
    String(item.revision),
    item.floorValue.toFixed(2),
    item.variant,
    String(item.attempts),
    String(item.clicks),
    item.currency,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPlacementCheckpointViews(items: PrimaryPlacementCheckpoint[]): PrimaryPlacementCheckpointView[] {
  const views: PrimaryPlacementCheckpointView[] = [];
  for (const item of items) {
    views.push(toPrimaryPlacementCheckpointView(item));
  }
  return views;
}

export function sumPrimaryPlacementCheckpointView(view: PrimaryPlacementCheckpointView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedRevision + parsedFloorValue + parsedAttempts;
}
