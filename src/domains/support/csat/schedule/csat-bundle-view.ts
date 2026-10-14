import * as text from "../../../../kit/text.js";
import { CsatBundle } from "./csat-bundle.js";

/** How screens and exports show a csat bundle. */
export class CsatBundleView {
  codeText: string;
  titleText: string;
  active: string;
  approved: string;
  name: string;
  archived: string;
  ceilingText: string;
  quantity: string;
  channelText: string;
  cohort: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    active: string,
    approved: string,
    name: string,
    archived: string,
    ceilingText: string,
    quantity: string,
    channelText: string,
    cohort: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.active = active;
    this.approved = approved;
    this.name = name;
    this.archived = archived;
    this.ceilingText = ceilingText;
    this.quantity = quantity;
    this.channelText = channelText;
    this.cohort = cohort;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toCsatBundleView(item: CsatBundle): CsatBundleView {
  return new CsatBundleView(
    item.code,
    item.title,
    `${item.active}`,
    `${item.approved}`,
    text.truncate(item.name, 64),
    `${item.archived}`,
    item.ceiling.toFixed(2),
    String(item.quantity),
    item.channel,
    text.truncate(item.cohort, 120),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatBundleViews(items: CsatBundle[]): CsatBundleView[] {
  const views: CsatBundleView[] = [];
  for (const item of items) {
    views.push(toCsatBundleView(item));
  }
  return views;
}

export function sumCsatBundleView(view: CsatBundleView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedCeiling + parsedQuantity;
}
