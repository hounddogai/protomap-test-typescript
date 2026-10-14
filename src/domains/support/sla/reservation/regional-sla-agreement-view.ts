import * as text from "../../../../kit/text.js";
import { RegionalSlaAgreement } from "./regional-sla-agreement.js";

/** How screens and exports show a regional sla agreement. */
export class RegionalSlaAgreementView {
  code: string;
  title: string;
  sendAtText: string;
  contactEmail: string;
  ratioText: string;
  version: string;
  bid: string;
  cost: string;
  floorValueText: string;
  amount: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sendAtText: string,
    contactEmail: string,
    ratioText: string,
    version: string,
    bid: string,
    cost: string,
    floorValueText: string,
    amount: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sendAtText = sendAtText;
    this.contactEmail = contactEmail;
    this.ratioText = ratioText;
    this.version = version;
    this.bid = bid;
    this.cost = cost;
    this.floorValueText = floorValueText;
    this.amount = amount;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSlaAgreementView(item: RegionalSlaAgreement): RegionalSlaAgreementView {
  return new RegionalSlaAgreementView(
    text.truncate(item.code, 40),
    item.title,
    String(item.sendAt),
    item.contactEmail,
    item.ratio.toFixed(2),
    String(item.version),
    item.bid.toFixed(2),
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    item.amount.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSlaAgreementViews(items: RegionalSlaAgreement[]): RegionalSlaAgreementView[] {
  const views: RegionalSlaAgreementView[] = [];
  for (const item of items) {
    views.push(toRegionalSlaAgreementView(item));
  }
  return views;
}

export function sumRegionalSlaAgreementView(view: RegionalSlaAgreementView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedSendAt + parsedRatio + parsedVersion;
}
