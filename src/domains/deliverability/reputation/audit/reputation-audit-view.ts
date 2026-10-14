import * as text from "../../../../kit/text.js";
import { ReputationAudit } from "./reputation-audit.js";

/** How screens and exports show a reputation audit. */
export class ReputationAuditView {
  code: string;
  name: string;
  journeyId: string;
  ceiling: string;
  active: string;
  rate: string;
  campaignRef: string;
  ratioText: string;
  sendAt: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    ceiling: string,
    active: string,
    rate: string,
    campaignRef: string,
    ratioText: string,
    sendAt: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.active = active;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.ratioText = ratioText;
    this.sendAt = sendAt;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toReputationAuditView(item: ReputationAudit): ReputationAuditView {
  return new ReputationAuditView(
    text.truncate(item.code, 40),
    item.name,
    text.truncate(item.journeyId, 40),
    item.ceiling.toFixed(2),
    `${item.active}`,
    item.rate.toFixed(2),
    item.campaignRef,
    item.ratio.toFixed(2),
    String(item.sendAt),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationAuditViews(items: ReputationAudit[]): ReputationAuditView[] {
  const views: ReputationAuditView[] = [];
  for (const item of items) {
    views.push(toReputationAuditView(item));
  }
  return views;
}

export function sumReputationAuditView(view: ReputationAuditView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedCeiling + parsedRate + parsedRatio;
}
