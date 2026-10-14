import * as text from "../../../../kit/text.js";
import { PrimaryTouchpointTarget } from "./primary-touchpoint-target.js";

/** How screens and exports show a primary touchpoint target. */
export class PrimaryTouchpointTargetView {
  code: string;
  name: string;
  amountText: string;
  version: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    amountText: string,
    version: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.amountText = amountText;
    this.version = version;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTouchpointTargetView(item: PrimaryTouchpointTarget): PrimaryTouchpointTargetView {
  return new PrimaryTouchpointTargetView(
    item.code,
    text.truncate(item.name, 80),
    item.amount.toFixed(2),
    String(item.version),
    text.truncate(item.variant, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTouchpointTargetViews(items: PrimaryTouchpointTarget[]): PrimaryTouchpointTargetView[] {
  const views: PrimaryTouchpointTargetView[] = [];
  for (const item of items) {
    views.push(toPrimaryTouchpointTargetView(item));
  }
  return views;
}

export function sumPrimaryTouchpointTargetView(view: PrimaryTouchpointTargetView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedAmount + parsedVersion;
}
