import { ScheduledPlacementSegment } from "./scheduled-placement-segment.js";

/** How screens and exports show a scheduled placement segment. */
export class ScheduledPlacementSegmentView {
  code: string;
  name: string;
  scoreText: string;
  revisionText: string;
  ownerId: string;
  maximum: string;
  contactEmailText: string;
  pinnedText: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    scoreText: string,
    revisionText: string,
    ownerId: string,
    maximum: string,
    contactEmailText: string,
    pinnedText: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.scoreText = scoreText;
    this.revisionText = revisionText;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.contactEmailText = contactEmailText;
    this.pinnedText = pinnedText;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPlacementSegmentView(item: ScheduledPlacementSegment): ScheduledPlacementSegmentView {
  return new ScheduledPlacementSegmentView(
    item.code,
    item.name,
    item.score.toFixed(2),
    String(item.revision),
    item.ownerId,
    item.maximum.toFixed(2),
    item.contactEmail,
    `${item.pinned}`,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPlacementSegmentViews(items: ScheduledPlacementSegment[]): ScheduledPlacementSegmentView[] {
  const views: ScheduledPlacementSegmentView[] = [];
  for (const item of items) {
    views.push(toScheduledPlacementSegmentView(item));
  }
  return views;
}

export function sumScheduledPlacementSegmentView(view: ScheduledPlacementSegmentView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedScore + parsedRevision + parsedMaximum;
}
