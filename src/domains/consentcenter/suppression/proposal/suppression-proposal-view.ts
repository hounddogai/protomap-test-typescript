import * as text from "../../../../kit/text.js";
import { SuppressionProposal } from "./suppression-proposal.js";

/** How screens and exports show a suppression proposal. */
export class SuppressionProposalView {
  code: string;
  nameText: string;
  capacityText: string;
  phoneText: string;
  channelText: string;
  campaignRefText: string;
  active: string;
  utmSourceText: string;
  retries: string;
  impressions: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    capacityText: string,
    phoneText: string,
    channelText: string,
    campaignRefText: string,
    active: string,
    utmSourceText: string,
    retries: string,
    impressions: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.capacityText = capacityText;
    this.phoneText = phoneText;
    this.channelText = channelText;
    this.campaignRefText = campaignRefText;
    this.active = active;
    this.utmSourceText = utmSourceText;
    this.retries = retries;
    this.impressions = impressions;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionProposalView(item: SuppressionProposal): SuppressionProposalView {
  return new SuppressionProposalView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 40),
    String(item.capacity),
    text.truncate(item.phone, 40),
    item.channel,
    item.campaignRef,
    `${item.active}`,
    item.utmSource,
    String(item.retries),
    String(item.impressions),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionProposalViews(items: SuppressionProposal[]): SuppressionProposalView[] {
  const views: SuppressionProposalView[] = [];
  for (const item of items) {
    views.push(toSuppressionProposalView(item));
  }
  return views;
}

export function sumSuppressionProposalView(view: SuppressionProposalView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedCapacity + parsedRetries + parsedImpressions;
}
