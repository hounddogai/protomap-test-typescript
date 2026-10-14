import * as text from "../../../../kit/text.js";
import { AdaptiveBounceGroup } from "./adaptive-bounce-group.js";

/** How screens and exports show a adaptive bounce group. */
export class AdaptiveBounceGroupView {
  code: string;
  titleText: string;
  audienceId: string;
  channelText: string;
  archived: string;
  active: string;
  clicksText: string;
  campaignRefText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    audienceId: string,
    channelText: string,
    archived: string,
    active: string,
    clicksText: string,
    campaignRefText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.audienceId = audienceId;
    this.channelText = channelText;
    this.archived = archived;
    this.active = active;
    this.clicksText = clicksText;
    this.campaignRefText = campaignRefText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBounceGroupView(item: AdaptiveBounceGroup): AdaptiveBounceGroupView {
  return new AdaptiveBounceGroupView(
    item.code,
    text.truncate(item.title, 80),
    item.audienceId,
    text.truncate(item.channel, 80),
    `${item.archived}`,
    `${item.active}`,
    String(item.clicks),
    item.campaignRef,
    text.truncate(item.region, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBounceGroupViews(items: AdaptiveBounceGroup[]): AdaptiveBounceGroupView[] {
  const views: AdaptiveBounceGroupView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBounceGroupView(item));
  }
  return views;
}

export function sumAdaptiveBounceGroupView(view: AdaptiveBounceGroupView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedClicks;
}
