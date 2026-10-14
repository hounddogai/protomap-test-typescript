import * as text from "../../../../kit/text.js";
import { StrictLeaderboardAllocation } from "./strict-leaderboard-allocation.js";

/** How screens and exports show a strict leaderboard allocation. */
export class StrictLeaderboardAllocationView {
  codeText: string;
  title: string;
  segment: string;
  margin: string;
  impressionsText: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    segment: string,
    margin: string,
    impressionsText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.segment = segment;
    this.margin = margin;
    this.impressionsText = impressionsText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toStrictLeaderboardAllocationView(item: StrictLeaderboardAllocation): StrictLeaderboardAllocationView {
  return new StrictLeaderboardAllocationView(
    item.code,
    text.truncate(item.title, 120),
    item.segment,
    item.margin.toFixed(2),
    String(item.impressions),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictLeaderboardAllocationViews(items: StrictLeaderboardAllocation[]): StrictLeaderboardAllocationView[] {
  const views: StrictLeaderboardAllocationView[] = [];
  for (const item of items) {
    views.push(toStrictLeaderboardAllocationView(item));
  }
  return views;
}

export function sumStrictLeaderboardAllocationView(view: StrictLeaderboardAllocationView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedMargin + parsedImpressions;
}
