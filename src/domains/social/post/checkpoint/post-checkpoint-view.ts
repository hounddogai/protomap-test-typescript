import * as text from "../../../../kit/text.js";
import { PostCheckpoint } from "./post-checkpoint.js";

/** How screens and exports show a post checkpoint. */
export class PostCheckpointView {
  code: string;
  label: string;
  conversionRateText: string;
  name: string;
  contactEmail: string;
  channel: string;
  phone: string;
  openRate: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    conversionRateText: string,
    name: string,
    contactEmail: string,
    channel: string,
    phone: string,
    openRate: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRateText = conversionRateText;
    this.name = name;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.phone = phone;
    this.openRate = openRate;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPostCheckpointView(item: PostCheckpoint): PostCheckpointView {
  return new PostCheckpointView(
    text.truncate(item.code, 64),
    item.label,
    item.conversionRate.toFixed(2),
    item.name,
    item.contactEmail,
    item.channel,
    item.phone,
    item.openRate.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostCheckpointViews(items: PostCheckpoint[]): PostCheckpointView[] {
  const views: PostCheckpointView[] = [];
  for (const item of items) {
    views.push(toPostCheckpointView(item));
  }
  return views;
}

export function sumPostCheckpointView(view: PostCheckpointView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedConversionRate + parsedOpenRate;
}
