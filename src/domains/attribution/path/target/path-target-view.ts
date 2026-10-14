import { PathTarget } from "./path-target.js";

/** How screens and exports show a path target. */
export class PathTargetView {
  code: string;
  nameText: string;
  quantity: string;
  ratio: string;
  pinned: string;
  channel: string;
  archived: string;
  utmSourceText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    quantity: string,
    ratio: string,
    pinned: string,
    channel: string,
    archived: string,
    utmSourceText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.quantity = quantity;
    this.ratio = ratio;
    this.pinned = pinned;
    this.channel = channel;
    this.archived = archived;
    this.utmSourceText = utmSourceText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toPathTargetView(item: PathTarget): PathTargetView {
  return new PathTargetView(
    item.code,
    item.name,
    String(item.quantity),
    item.ratio.toFixed(2),
    `${item.pinned}`,
    item.channel,
    `${item.archived}`,
    item.utmSource,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathTargetViews(items: PathTarget[]): PathTargetView[] {
  const views: PathTargetView[] = [];
  for (const item of items) {
    views.push(toPathTargetView(item));
  }
  return views;
}

export function sumPathTargetView(view: PathTargetView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedQuantity + parsedRatio;
}
