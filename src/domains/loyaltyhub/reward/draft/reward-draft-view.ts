import * as text from "../../../../kit/text.js";
import { RewardDraft } from "./reward-draft.js";

/** How screens and exports show a reward draft. */
export class RewardDraftView {
  code: string;
  title: string;
  batchSize: string;
  ceiling: string;
  startsAt: string;
  labelText: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSize: string,
    ceiling: string,
    startsAt: string,
    labelText: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.startsAt = startsAt;
    this.labelText = labelText;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toRewardDraftView(item: RewardDraft): RewardDraftView {
  return new RewardDraftView(
    item.code,
    text.truncate(item.title, 40),
    String(item.batchSize),
    item.ceiling.toFixed(2),
    String(item.startsAt),
    item.label,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardDraftViews(items: RewardDraft[]): RewardDraftView[] {
  const views: RewardDraftView[] = [];
  for (const item of items) {
    views.push(toRewardDraftView(item));
  }
  return views;
}

export function sumRewardDraftView(view: RewardDraftView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBatchSize + parsedCeiling + parsedStartsAt;
}
