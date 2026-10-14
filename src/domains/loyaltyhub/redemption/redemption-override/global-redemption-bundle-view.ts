import * as text from "../../../../kit/text.js";
import { GlobalRedemptionBundle } from "./global-redemption-bundle.js";

/** How screens and exports show a global redemption bundle. */
export class GlobalRedemptionBundleView {
  code: string;
  label: string;
  channel: string;
  utmSourceText: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    utmSourceText: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.utmSourceText = utmSourceText;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRedemptionBundleView(item: GlobalRedemptionBundle): GlobalRedemptionBundleView {
  return new GlobalRedemptionBundleView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.channel, 40),
    item.utmSource,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRedemptionBundleViews(items: GlobalRedemptionBundle[]): GlobalRedemptionBundleView[] {
  const views: GlobalRedemptionBundleView[] = [];
  for (const item of items) {
    views.push(toGlobalRedemptionBundleView(item));
  }
  return views;
}

export function sumGlobalRedemptionBundleView(view: GlobalRedemptionBundleView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
