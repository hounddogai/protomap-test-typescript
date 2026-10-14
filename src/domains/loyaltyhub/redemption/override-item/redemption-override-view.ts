import { RedemptionOverride } from "./redemption-override.js";

/** How screens and exports show a redemption override. */
export class RedemptionOverrideView {
  codeText: string;
  label: string;
  nameText: string;
  description: string;
  sendAtText: string;
  notes: string;
  versionText: string;
  openRate: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    nameText: string,
    description: string,
    sendAtText: string,
    notes: string,
    versionText: string,
    openRate: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.nameText = nameText;
    this.description = description;
    this.sendAtText = sendAtText;
    this.notes = notes;
    this.versionText = versionText;
    this.openRate = openRate;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionOverrideView(item: RedemptionOverride): RedemptionOverrideView {
  return new RedemptionOverrideView(
    item.code,
    item.label,
    item.name,
    item.description,
    String(item.sendAt),
    item.notes,
    String(item.version),
    item.openRate.toFixed(2),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionOverrideViews(items: RedemptionOverride[]): RedemptionOverrideView[] {
  const views: RedemptionOverrideView[] = [];
  for (const item of items) {
    views.push(toRedemptionOverrideView(item));
  }
  return views;
}

export function sumRedemptionOverrideView(view: RedemptionOverrideView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedSendAt + parsedVersion + parsedOpenRate;
}
