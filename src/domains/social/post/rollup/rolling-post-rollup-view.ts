import { RollingPostRollup } from "./rolling-post-rollup.js";

/** How screens and exports show a rolling post rollup. */
export class RollingPostRollupView {
  code: string;
  labelText: string;
  archived: string;
  weight: string;
  updatedAt: string;
  channel: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    archived: string,
    weight: string,
    updatedAt: string,
    channel: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.archived = archived;
    this.weight = weight;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPostRollupView(item: RollingPostRollup): RollingPostRollupView {
  return new RollingPostRollupView(
    item.code,
    item.label,
    `${item.archived}`,
    item.weight.toFixed(2),
    String(item.updatedAt),
    item.channel,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPostRollupViews(items: RollingPostRollup[]): RollingPostRollupView[] {
  const views: RollingPostRollupView[] = [];
  for (const item of items) {
    views.push(toRollingPostRollupView(item));
  }
  return views;
}

export function sumRollingPostRollupView(view: RollingPostRollupView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWeight + parsedUpdatedAt;
}
