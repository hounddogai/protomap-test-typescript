import * as text from "../../../../kit/text.js";
import { GlobalMacroThreshold } from "./global-macro-threshold.js";

/** How screens and exports show a global macro threshold. */
export class GlobalMacroThresholdView {
  code: string;
  title: string;
  ratioText: string;
  channelText: string;
  startsAt: string;
  archived: string;
  limitText: string;
  bid: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratioText: string,
    channelText: string,
    startsAt: string,
    archived: string,
    limitText: string,
    bid: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratioText = ratioText;
    this.channelText = channelText;
    this.startsAt = startsAt;
    this.archived = archived;
    this.limitText = limitText;
    this.bid = bid;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalMacroThresholdView(item: GlobalMacroThreshold): GlobalMacroThresholdView {
  return new GlobalMacroThresholdView(
    text.truncate(item.code, 64),
    item.title,
    item.ratio.toFixed(2),
    text.truncate(item.channel, 64),
    String(item.startsAt),
    `${item.archived}`,
    String(item.limit),
    item.bid.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalMacroThresholdViews(items: GlobalMacroThreshold[]): GlobalMacroThresholdView[] {
  const views: GlobalMacroThresholdView[] = [];
  for (const item of items) {
    views.push(toGlobalMacroThresholdView(item));
  }
  return views;
}

export function sumGlobalMacroThresholdView(view: GlobalMacroThresholdView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedRatio + parsedStartsAt + parsedLimit;
}
