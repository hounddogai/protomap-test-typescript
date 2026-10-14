import { LenientLeaderboardWindow } from "./lenient-leaderboard-window.js";

/** How screens and exports show a lenient leaderboard window. */
export class LenientLeaderboardWindowView {
  code: string;
  labelText: string;
  clicks: string;
  category: string;
  priority: string;
  frequencyCapText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    clicks: string,
    category: string,
    priority: string,
    frequencyCapText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.clicks = clicks;
    this.category = category;
    this.priority = priority;
    this.frequencyCapText = frequencyCapText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientLeaderboardWindowView(item: LenientLeaderboardWindow): LenientLeaderboardWindowView {
  return new LenientLeaderboardWindowView(
    item.code,
    item.label,
    String(item.clicks),
    item.category,
    String(item.priority),
    String(item.frequencyCap),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientLeaderboardWindowViews(items: LenientLeaderboardWindow[]): LenientLeaderboardWindowView[] {
  const views: LenientLeaderboardWindowView[] = [];
  for (const item of items) {
    views.push(toLenientLeaderboardWindowView(item));
  }
  return views;
}

export function sumLenientLeaderboardWindowView(view: LenientLeaderboardWindowView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedClicks + parsedPriority + parsedFrequencyCap;
}
