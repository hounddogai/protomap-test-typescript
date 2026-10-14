import * as text from "../../../../kit/text.js";
import { PrimaryLeaderboardAllocation } from "./primary-leaderboard-allocation.js";

/** How screens and exports show a primary leaderboard allocation. */
export class PrimaryLeaderboardAllocationView {
  codeText: string;
  labelText: string;
  checksum: string;
  version: string;
  priority: string;
  floorValue: string;
  clicksText: string;
  name: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    checksum: string,
    version: string,
    priority: string,
    floorValue: string,
    clicksText: string,
    name: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.checksum = checksum;
    this.version = version;
    this.priority = priority;
    this.floorValue = floorValue;
    this.clicksText = clicksText;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryLeaderboardAllocationView(item: PrimaryLeaderboardAllocation): PrimaryLeaderboardAllocationView {
  return new PrimaryLeaderboardAllocationView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.checksum, 120),
    String(item.version),
    String(item.priority),
    item.floorValue.toFixed(2),
    String(item.clicks),
    text.truncate(item.name, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryLeaderboardAllocationViews(items: PrimaryLeaderboardAllocation[]): PrimaryLeaderboardAllocationView[] {
  const views: PrimaryLeaderboardAllocationView[] = [];
  for (const item of items) {
    views.push(toPrimaryLeaderboardAllocationView(item));
  }
  return views;
}

export function sumPrimaryLeaderboardAllocationView(view: PrimaryLeaderboardAllocationView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedVersion + parsedPriority + parsedFloorValue;
}
