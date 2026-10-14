import * as text from "../../../../kit/text.js";
import { WeightedReputationTarget } from "./weighted-reputation-target.js";

/** How screens and exports show a weighted reputation target. */
export class WeightedReputationTargetView {
  code: string;
  title: string;
  label: string;
  sendAt: string;
  locale: string;
  updatedAtText: string;
  channelText: string;
  source: string;
  approvedText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    label: string,
    sendAt: string,
    locale: string,
    updatedAtText: string,
    channelText: string,
    source: string,
    approvedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.sendAt = sendAt;
    this.locale = locale;
    this.updatedAtText = updatedAtText;
    this.channelText = channelText;
    this.source = source;
    this.approvedText = approvedText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReputationTargetView(item: WeightedReputationTarget): WeightedReputationTargetView {
  return new WeightedReputationTargetView(
    item.code,
    item.title,
    text.truncate(item.label, 120),
    String(item.sendAt),
    item.locale,
    String(item.updatedAt),
    item.channel,
    item.source,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReputationTargetViews(items: WeightedReputationTarget[]): WeightedReputationTargetView[] {
  const views: WeightedReputationTargetView[] = [];
  for (const item of items) {
    views.push(toWeightedReputationTargetView(item));
  }
  return views;
}

export function sumWeightedReputationTargetView(view: WeightedReputationTargetView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedSendAt + parsedUpdatedAt;
}
