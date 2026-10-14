import * as text from "../../../../kit/text.js";
import { PostTier } from "./post-tier.js";

/** How screens and exports show a post tier. */
export class PostTierView {
  code: string;
  name: string;
  label: string;
  visible: string;
  scoreText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    label: string,
    visible: string,
    scoreText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.visible = visible;
    this.scoreText = scoreText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toPostTierView(item: PostTier): PostTierView {
  return new PostTierView(
    text.truncate(item.code, 40),
    item.name,
    item.label,
    `${item.visible}`,
    item.score.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostTierViews(items: PostTier[]): PostTierView[] {
  const views: PostTierView[] = [];
  for (const item of items) {
    views.push(toPostTierView(item));
  }
  return views;
}

export function sumPostTierView(view: PostTierView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedScore + parsedExpiresAt;
}
