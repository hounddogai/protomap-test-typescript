import * as text from "../../../../kit/text.js";
import { StrictRewardRuleManifest } from "./strict-reward-rule-manifest.js";

/** How screens and exports show a strict reward rule manifest. */
export class StrictRewardRuleManifestView {
  code: string;
  label: string;
  approved: string;
  version: string;
  floorValue: string;
  externalRefText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approved: string,
    version: string,
    floorValue: string,
    externalRefText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.version = version;
    this.floorValue = floorValue;
    this.externalRefText = externalRefText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toStrictRewardRuleManifestView(item: StrictRewardRuleManifest): StrictRewardRuleManifestView {
  return new StrictRewardRuleManifestView(
    text.truncate(item.code, 64),
    item.label,
    `${item.approved}`,
    String(item.version),
    item.floorValue.toFixed(2),
    item.externalRef,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictRewardRuleManifestViews(items: StrictRewardRuleManifest[]): StrictRewardRuleManifestView[] {
  const views: StrictRewardRuleManifestView[] = [];
  for (const item of items) {
    views.push(toStrictRewardRuleManifestView(item));
  }
  return views;
}

export function sumStrictRewardRuleManifestView(view: StrictRewardRuleManifestView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedVersion + parsedFloorValue + parsedRatio;
}
