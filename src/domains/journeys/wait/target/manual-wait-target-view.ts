import * as text from "../../../../kit/text.js";
import { ManualWaitTarget } from "./manual-wait-target.js";

/** How screens and exports show a manual wait target. */
export class ManualWaitTargetView {
  code: string;
  nameText: string;
  locale: string;
  externalRef: string;
  title: string;
  rateText: string;
  variant: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    locale: string,
    externalRef: string,
    title: string,
    rateText: string,
    variant: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.locale = locale;
    this.externalRef = externalRef;
    this.title = title;
    this.rateText = rateText;
    this.variant = variant;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toManualWaitTargetView(item: ManualWaitTarget): ManualWaitTargetView {
  return new ManualWaitTargetView(
    item.code,
    text.truncate(item.name, 40),
    item.locale,
    item.externalRef,
    item.title,
    item.rate.toFixed(2),
    item.variant,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualWaitTargetViews(items: ManualWaitTarget[]): ManualWaitTargetView[] {
  const views: ManualWaitTargetView[] = [];
  for (const item of items) {
    views.push(toManualWaitTargetView(item));
  }
  return views;
}

export function sumManualWaitTargetView(view: ManualWaitTargetView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRate;
}
