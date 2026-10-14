import * as text from "../../../../kit/text.js";
import { WindowAgreement } from "./window-agreement.js";

/** How screens and exports show a window agreement. */
export class WindowAgreementView {
  codeText: string;
  name: string;
  category: string;
  bid: string;
  title: string;
  visible: string;
  rate: string;
  campaignRef: string;
  batchSize: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    category: string,
    bid: string,
    title: string,
    visible: string,
    rate: string,
    campaignRef: string,
    batchSize: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.category = category;
    this.bid = bid;
    this.title = title;
    this.visible = visible;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.batchSize = batchSize;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toWindowAgreementView(item: WindowAgreement): WindowAgreementView {
  return new WindowAgreementView(
    item.code,
    item.name,
    item.category,
    item.bid.toFixed(2),
    item.title,
    `${item.visible}`,
    item.rate.toFixed(2),
    text.truncate(item.campaignRef, 64),
    String(item.batchSize),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowAgreementViews(items: WindowAgreement[]): WindowAgreementView[] {
  const views: WindowAgreementView[] = [];
  for (const item of items) {
    views.push(toWindowAgreementView(item));
  }
  return views;
}

export function sumWindowAgreementView(view: WindowAgreementView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBid + parsedRate + parsedBatchSize;
}
