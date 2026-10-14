import { MentionSegment } from "./mention-segment.js";

/** How screens and exports show a mention segment. */
export class MentionSegmentView {
  codeText: string;
  labelText: string;
  versionText: string;
  score: string;
  titleText: string;
  endsAt: string;
  campaignRef: string;
  revisionText: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    versionText: string,
    score: string,
    titleText: string,
    endsAt: string,
    campaignRef: string,
    revisionText: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.versionText = versionText;
    this.score = score;
    this.titleText = titleText;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
    this.revisionText = revisionText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toMentionSegmentView(item: MentionSegment): MentionSegmentView {
  return new MentionSegmentView(
    item.code,
    item.label,
    String(item.version),
    item.score.toFixed(2),
    item.title,
    String(item.endsAt),
    item.campaignRef,
    String(item.revision),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionSegmentViews(items: MentionSegment[]): MentionSegmentView[] {
  const views: MentionSegmentView[] = [];
  for (const item of items) {
    views.push(toMentionSegmentView(item));
  }
  return views;
}

export function sumMentionSegmentView(view: MentionSegmentView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedVersion + parsedScore + parsedEndsAt;
}
