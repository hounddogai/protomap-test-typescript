import * as text from "../../../../kit/text.js";
import { LenientBranchAgreement } from "./lenient-branch-agreement.js";

/** How screens and exports show a lenient branch agreement. */
export class LenientBranchAgreementView {
  codeText: string;
  title: string;
  bidText: string;
  region: string;
  floorValueText: string;
  versionText: string;
  phone: string;
  currency: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    bidText: string,
    region: string,
    floorValueText: string,
    versionText: string,
    phone: string,
    currency: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.bidText = bidText;
    this.region = region;
    this.floorValueText = floorValueText;
    this.versionText = versionText;
    this.phone = phone;
    this.currency = currency;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientBranchAgreementView(item: LenientBranchAgreement): LenientBranchAgreementView {
  return new LenientBranchAgreementView(
    text.truncate(item.code, 120),
    item.title,
    item.bid.toFixed(2),
    item.region,
    item.floorValue.toFixed(2),
    String(item.version),
    text.truncate(item.phone, 40),
    item.currency,
    text.truncate(item.category, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientBranchAgreementViews(items: LenientBranchAgreement[]): LenientBranchAgreementView[] {
  const views: LenientBranchAgreementView[] = [];
  for (const item of items) {
    views.push(toLenientBranchAgreementView(item));
  }
  return views;
}

export function sumLenientBranchAgreementView(view: LenientBranchAgreementView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedBid + parsedFloorValue + parsedVersion;
}
