import * as text from "../../../../kit/text.js";
import { CappedActivationAudit } from "./capped-activation-audit.js";

/** How screens and exports show a capped activation audit. */
export class CappedActivationAuditView {
  codeText: string;
  labelText: string;
  sendAtText: string;
  checksumText: string;
  version: string;
  weight: string;
  cost: string;
  localeText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    sendAtText: string,
    checksumText: string,
    version: string,
    weight: string,
    cost: string,
    localeText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.sendAtText = sendAtText;
    this.checksumText = checksumText;
    this.version = version;
    this.weight = weight;
    this.cost = cost;
    this.localeText = localeText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toCappedActivationAuditView(item: CappedActivationAudit): CappedActivationAuditView {
  return new CappedActivationAuditView(
    item.code,
    text.truncate(item.label, 64),
    String(item.sendAt),
    text.truncate(item.checksum, 64),
    String(item.version),
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    text.truncate(item.locale, 64),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedActivationAuditViews(items: CappedActivationAudit[]): CappedActivationAuditView[] {
  const views: CappedActivationAuditView[] = [];
  for (const item of items) {
    views.push(toCappedActivationAuditView(item));
  }
  return views;
}

export function sumCappedActivationAuditView(view: CappedActivationAuditView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedSendAt + parsedVersion + parsedWeight;
}
