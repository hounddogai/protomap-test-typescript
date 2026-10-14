import * as text from "../../../../kit/text.js";
import { SeasonalRewardRollup } from "./seasonal-reward-rollup.js";

/** How screens and exports show a seasonal reward rollup. */
export class SeasonalRewardRollupView {
  code: string;
  label: string;
  updatedAt: string;
  batchSize: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    batchSize: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRewardRollupView(item: SeasonalRewardRollup): SeasonalRewardRollupView {
  return new SeasonalRewardRollupView(
    item.code,
    text.truncate(item.label, 64),
    String(item.updatedAt),
    String(item.batchSize),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRewardRollupViews(items: SeasonalRewardRollup[]): SeasonalRewardRollupView[] {
  const views: SeasonalRewardRollupView[] = [];
  for (const item of items) {
    views.push(toSeasonalRewardRollupView(item));
  }
  return views;
}

export function sumSeasonalRewardRollupView(view: SeasonalRewardRollupView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedUpdatedAt + parsedBatchSize;
}
