import * as text from "../../../../kit/text.js";
import { TieredOptOutWindow } from "./tiered-opt-out-window.js";

/** How screens and exports show a tiered opt out window. */
export class TieredOptOutWindowView {
  code: string;
  nameText: string;
  ratio: string;
  visible: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ratio: string,
    visible: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ratio = ratio;
    this.visible = visible;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredOptOutWindowView(item: TieredOptOutWindow): TieredOptOutWindowView {
  return new TieredOptOutWindowView(
    text.truncate(item.code, 40),
    item.name,
    item.ratio.toFixed(2),
    `${item.visible}`,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredOptOutWindowViews(items: TieredOptOutWindow[]): TieredOptOutWindowView[] {
  const views: TieredOptOutWindowView[] = [];
  for (const item of items) {
    views.push(toTieredOptOutWindowView(item));
  }
  return views;
}

export function sumTieredOptOutWindowView(view: TieredOptOutWindowView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
