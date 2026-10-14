import * as text from "../../../../kit/text.js";
import { ReputationProfile } from "./reputation-profile.js";

/** How screens and exports show a reputation profile. */
export class ReputationProfileView {
  codeText: string;
  label: string;
  region: string;
  contactEmail: string;
  channelText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    region: string,
    contactEmail: string,
    channelText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.region = region;
    this.contactEmail = contactEmail;
    this.channelText = channelText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toReputationProfileView(item: ReputationProfile): ReputationProfileView {
  return new ReputationProfileView(
    item.code,
    item.label,
    item.region,
    item.contactEmail,
    text.truncate(item.channel, 120),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationProfileViews(items: ReputationProfile[]): ReputationProfileView[] {
  const views: ReputationProfileView[] = [];
  for (const item of items) {
    views.push(toReputationProfileView(item));
  }
  return views;
}

export function sumReputationProfileView(view: ReputationProfileView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
