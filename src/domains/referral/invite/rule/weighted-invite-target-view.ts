import * as text from "../../../../kit/text.js";
import { WeightedInviteTarget } from "./weighted-invite-target.js";

/** How screens and exports show a weighted invite target. */
export class WeightedInviteTargetView {
  codeText: string;
  title: string;
  updatedAt: string;
  score: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    updatedAt: string,
    score: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.updatedAt = updatedAt;
    this.score = score;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedInviteTargetView(item: WeightedInviteTarget): WeightedInviteTargetView {
  return new WeightedInviteTargetView(
    text.truncate(item.code, 64),
    item.title,
    String(item.updatedAt),
    item.score.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedInviteTargetViews(items: WeightedInviteTarget[]): WeightedInviteTargetView[] {
  const views: WeightedInviteTargetView[] = [];
  for (const item of items) {
    views.push(toWeightedInviteTargetView(item));
  }
  return views;
}

export function sumWeightedInviteTargetView(view: WeightedInviteTargetView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedUpdatedAt + parsedScore + parsedFrequencyCap;
}
