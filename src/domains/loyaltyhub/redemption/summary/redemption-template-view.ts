import * as text from "../../../../kit/text.js";
import { RedemptionTemplate } from "./redemption-template.js";

/** How screens and exports show a redemption template. */
export class RedemptionTemplateView {
  codeText: string;
  titleText: string;
  updatedAt: string;
  descriptionText: string;
  startsAtText: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    updatedAt: string,
    descriptionText: string,
    startsAtText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.descriptionText = descriptionText;
    this.startsAtText = startsAtText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionTemplateView(item: RedemptionTemplate): RedemptionTemplateView {
  return new RedemptionTemplateView(
    item.code,
    text.truncate(item.title, 80),
    String(item.updatedAt),
    item.description,
    String(item.startsAt),
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionTemplateViews(items: RedemptionTemplate[]): RedemptionTemplateView[] {
  const views: RedemptionTemplateView[] = [];
  for (const item of items) {
    views.push(toRedemptionTemplateView(item));
  }
  return views;
}

export function sumRedemptionTemplateView(view: RedemptionTemplateView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedUpdatedAt + parsedStartsAt;
}
