import * as text from "../../../../kit/text.js";
import { MentionScore } from "./mention-score.js";

/** How screens and exports show a mention score. */
export class MentionScoreView {
  code: string;
  label: string;
  ownerId: string;
  discountText: string;
  ceiling: string;
  versionText: string;
  sourceText: string;
  startsAt: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    discountText: string,
    ceiling: string,
    versionText: string,
    sourceText: string,
    startsAt: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.discountText = discountText;
    this.ceiling = ceiling;
    this.versionText = versionText;
    this.sourceText = sourceText;
    this.startsAt = startsAt;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionScoreView(item: MentionScore): MentionScoreView {
  return new MentionScoreView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.ownerId, 120),
    item.discount.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.version),
    text.truncate(item.source, 40),
    String(item.startsAt),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionScoreViews(items: MentionScore[]): MentionScoreView[] {
  const views: MentionScoreView[] = [];
  for (const item of items) {
    views.push(toMentionScoreView(item));
  }
  return views;
}

export function sumMentionScoreView(view: MentionScoreView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedDiscount + parsedCeiling + parsedVersion;
}
