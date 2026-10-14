import * as text from "../../../../kit/text.js";
import { RegionalOptOutCheckpoint } from "./regional-opt-out-checkpoint.js";

/** How screens and exports show a regional opt out checkpoint. */
export class RegionalOptOutCheckpointView {
  code: string;
  label: string;
  graceDays: string;
  approvedText: string;
  conversionRate: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    approvedText: string,
    conversionRate: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.approvedText = approvedText;
    this.conversionRate = conversionRate;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalOptOutCheckpointView(item: RegionalOptOutCheckpoint): RegionalOptOutCheckpointView {
  return new RegionalOptOutCheckpointView(
    item.code,
    text.truncate(item.label, 40),
    String(item.graceDays),
    `${item.approved}`,
    item.conversionRate.toFixed(2),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalOptOutCheckpointViews(items: RegionalOptOutCheckpoint[]): RegionalOptOutCheckpointView[] {
  const views: RegionalOptOutCheckpointView[] = [];
  for (const item of items) {
    views.push(toRegionalOptOutCheckpointView(item));
  }
  return views;
}

export function sumRegionalOptOutCheckpointView(view: RegionalOptOutCheckpointView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedGraceDays + parsedConversionRate + parsedVersion;
}
