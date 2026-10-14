import * as text from "../../../../kit/text.js";
import { ManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

/** How screens and exports show a manual leaderboard milestone. */
export class ManualLeaderboardMilestoneView {
  code: string;
  name: string;
  audienceId: string;
  attemptsText: string;
  priority: string;
  description: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    attemptsText: string,
    priority: string,
    description: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.attemptsText = attemptsText;
    this.priority = priority;
    this.description = description;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toManualLeaderboardMilestoneView(item: ManualLeaderboardMilestone): ManualLeaderboardMilestoneView {
  return new ManualLeaderboardMilestoneView(
    item.code,
    item.name,
    text.truncate(item.audienceId, 80),
    String(item.attempts),
    String(item.priority),
    item.description,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualLeaderboardMilestoneViews(items: ManualLeaderboardMilestone[]): ManualLeaderboardMilestoneView[] {
  const views: ManualLeaderboardMilestoneView[] = [];
  for (const item of items) {
    views.push(toManualLeaderboardMilestoneView(item));
  }
  return views;
}

export function sumManualLeaderboardMilestoneView(view: ManualLeaderboardMilestoneView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedAttempts + parsedPriority + parsedFloorValue;
}
