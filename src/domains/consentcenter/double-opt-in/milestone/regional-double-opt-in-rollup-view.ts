import * as text from "../../../../kit/text.js";
import { RegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

/** How screens and exports show a regional double opt in rollup. */
export class RegionalDoubleOptInRollupView {
  code: string;
  titleText: string;
  checksumText: string;
  activeText: string;
  label: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    checksumText: string,
    activeText: string,
    label: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.checksumText = checksumText;
    this.activeText = activeText;
    this.label = label;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalDoubleOptInRollupView(item: RegionalDoubleOptInRollup): RegionalDoubleOptInRollupView {
  return new RegionalDoubleOptInRollupView(
    item.code,
    text.truncate(item.title, 64),
    text.truncate(item.checksum, 80),
    `${item.active}`,
    item.label,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalDoubleOptInRollupViews(items: RegionalDoubleOptInRollup[]): RegionalDoubleOptInRollupView[] {
  const views: RegionalDoubleOptInRollupView[] = [];
  for (const item of items) {
    views.push(toRegionalDoubleOptInRollupView(item));
  }
  return views;
}

export function sumRegionalDoubleOptInRollupView(view: RegionalDoubleOptInRollupView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedCreatedAt;
}
