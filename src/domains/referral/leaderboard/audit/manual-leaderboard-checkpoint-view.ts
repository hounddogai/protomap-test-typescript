import { ManualLeaderboardCheckpoint } from "./manual-leaderboard-checkpoint.js";

/** How screens and exports show a manual leaderboard checkpoint. */
export class ManualLeaderboardCheckpointView {
  code: string;
  title: string;
  phone: string;
  graceDays: string;
  ceiling: string;
  statusLabel: string;

  constructor(code: string, title: string, phone: string, graceDays: string, ceiling: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.graceDays = graceDays;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toManualLeaderboardCheckpointView(item: ManualLeaderboardCheckpoint): ManualLeaderboardCheckpointView {
  return new ManualLeaderboardCheckpointView(
    item.code,
    item.title,
    item.phone,
    String(item.graceDays),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualLeaderboardCheckpointViews(items: ManualLeaderboardCheckpoint[]): ManualLeaderboardCheckpointView[] {
  const views: ManualLeaderboardCheckpointView[] = [];
  for (const item of items) {
    views.push(toManualLeaderboardCheckpointView(item));
  }
  return views;
}

export function sumManualLeaderboardCheckpointView(view: ManualLeaderboardCheckpointView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedGraceDays + parsedCeiling;
}
