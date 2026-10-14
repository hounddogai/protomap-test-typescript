import * as text from "../../../../kit/text.js";
import { DefaultActivationTemplate } from "./default-activation-template.js";

/** How screens and exports show a default activation template. */
export class DefaultActivationTemplateView {
  code: string;
  titleText: string;
  batchSize: string;
  campaignRefText: string;
  startsAt: string;
  utmSourceText: string;
  clicks: string;
  description: string;
  channelText: string;
  label: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    batchSize: string,
    campaignRefText: string,
    startsAt: string,
    utmSourceText: string,
    clicks: string,
    description: string,
    channelText: string,
    label: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.batchSize = batchSize;
    this.campaignRefText = campaignRefText;
    this.startsAt = startsAt;
    this.utmSourceText = utmSourceText;
    this.clicks = clicks;
    this.description = description;
    this.channelText = channelText;
    this.label = label;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultActivationTemplateView(item: DefaultActivationTemplate): DefaultActivationTemplateView {
  return new DefaultActivationTemplateView(
    item.code,
    item.title,
    String(item.batchSize),
    item.campaignRef,
    String(item.startsAt),
    item.utmSource,
    String(item.clicks),
    item.description,
    item.channel,
    item.label,
    text.truncate(item.locale, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultActivationTemplateViews(items: DefaultActivationTemplate[]): DefaultActivationTemplateView[] {
  const views: DefaultActivationTemplateView[] = [];
  for (const item of items) {
    views.push(toDefaultActivationTemplateView(item));
  }
  return views;
}

export function sumDefaultActivationTemplateView(view: DefaultActivationTemplateView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBatchSize + parsedStartsAt + parsedClicks;
}
