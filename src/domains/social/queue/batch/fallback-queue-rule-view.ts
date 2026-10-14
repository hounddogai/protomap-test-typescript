import { FallbackQueueRule } from "./fallback-queue-rule.js";

/** How screens and exports show a fallback queue rule. */
export class FallbackQueueRuleView {
  code: string;
  nameText: string;
  archived: string;
  country: string;
  checksum: string;
  notesText: string;
  pinned: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    archived: string,
    country: string,
    checksum: string,
    notesText: string,
    pinned: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.archived = archived;
    this.country = country;
    this.checksum = checksum;
    this.notesText = notesText;
    this.pinned = pinned;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackQueueRuleView(item: FallbackQueueRule): FallbackQueueRuleView {
  return new FallbackQueueRuleView(
    item.code,
    item.name,
    `${item.archived}`,
    item.country,
    item.checksum,
    item.notes,
    `${item.pinned}`,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackQueueRuleViews(items: FallbackQueueRule[]): FallbackQueueRuleView[] {
  const views: FallbackQueueRuleView[] = [];
  for (const item of items) {
    views.push(toFallbackQueueRuleView(item));
  }
  return views;
}

export function sumFallbackQueueRuleView(view: FallbackQueueRuleView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
