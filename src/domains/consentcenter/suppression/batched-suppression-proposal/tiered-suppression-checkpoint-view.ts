import * as text from "../../../../kit/text.js";
import { TieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

/** How screens and exports show a tiered suppression checkpoint. */
export class TieredSuppressionCheckpointView {
  code: string;
  nameText: string;
  conversionRateText: string;
  sendAt: string;
  channelText: string;
  campaignRef: string;
  audienceId: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    conversionRateText: string,
    sendAt: string,
    channelText: string,
    campaignRef: string,
    audienceId: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.conversionRateText = conversionRateText;
    this.sendAt = sendAt;
    this.channelText = channelText;
    this.campaignRef = campaignRef;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSuppressionCheckpointView(item: TieredSuppressionCheckpoint): TieredSuppressionCheckpointView {
  return new TieredSuppressionCheckpointView(
    item.code,
    text.truncate(item.name, 120),
    item.conversionRate.toFixed(2),
    String(item.sendAt),
    item.channel,
    item.campaignRef,
    item.audienceId,
    text.truncate(item.contactEmail, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSuppressionCheckpointViews(items: TieredSuppressionCheckpoint[]): TieredSuppressionCheckpointView[] {
  const views: TieredSuppressionCheckpointView[] = [];
  for (const item of items) {
    views.push(toTieredSuppressionCheckpointView(item));
  }
  return views;
}

export function sumTieredSuppressionCheckpointView(view: TieredSuppressionCheckpointView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedConversionRate + parsedSendAt;
}
