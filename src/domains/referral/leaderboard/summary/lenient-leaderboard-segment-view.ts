import * as text from "../../../../kit/text.js";
import { LenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

/** How screens and exports show a lenient leaderboard segment. */
export class LenientLeaderboardSegmentView {
  code: string;
  name: string;
  revision: string;
  minimumText: string;
  updatedAt: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revision: string,
    minimumText: string,
    updatedAt: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.minimumText = minimumText;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toLenientLeaderboardSegmentView(item: LenientLeaderboardSegment): LenientLeaderboardSegmentView {
  return new LenientLeaderboardSegmentView(
    text.truncate(item.code, 40),
    item.name,
    String(item.revision),
    item.minimum.toFixed(2),
    String(item.updatedAt),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientLeaderboardSegmentViews(items: LenientLeaderboardSegment[]): LenientLeaderboardSegmentView[] {
  const views: LenientLeaderboardSegmentView[] = [];
  for (const item of items) {
    views.push(toLenientLeaderboardSegmentView(item));
  }
  return views;
}

export function sumLenientLeaderboardSegmentView(view: LenientLeaderboardSegmentView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedRevision + parsedMinimum + parsedUpdatedAt;
}
