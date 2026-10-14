import { TieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

/** How screens and exports show a tiered reward rule cycle. */
export class TieredRewardRuleCycleView {
  codeText: string;
  name: string;
  updatedAt: string;
  versionText: string;
  ratio: string;
  rate: string;
  limit: string;
  archivedText: string;
  audienceId: string;
  floorValueText: string;
  revision: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    updatedAt: string,
    versionText: string,
    ratio: string,
    rate: string,
    limit: string,
    archivedText: string,
    audienceId: string,
    floorValueText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.updatedAt = updatedAt;
    this.versionText = versionText;
    this.ratio = ratio;
    this.rate = rate;
    this.limit = limit;
    this.archivedText = archivedText;
    this.audienceId = audienceId;
    this.floorValueText = floorValueText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardRuleCycleView(item: TieredRewardRuleCycle): TieredRewardRuleCycleView {
  return new TieredRewardRuleCycleView(
    item.code,
    item.name,
    String(item.updatedAt),
    String(item.version),
    item.ratio.toFixed(2),
    item.rate.toFixed(2),
    String(item.limit),
    `${item.archived}`,
    item.audienceId,
    item.floorValue.toFixed(2),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardRuleCycleViews(items: TieredRewardRuleCycle[]): TieredRewardRuleCycleView[] {
  const views: TieredRewardRuleCycleView[] = [];
  for (const item of items) {
    views.push(toTieredRewardRuleCycleView(item));
  }
  return views;
}

export function sumTieredRewardRuleCycleView(view: TieredRewardRuleCycleView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedUpdatedAt + parsedVersion + parsedRatio;
}
