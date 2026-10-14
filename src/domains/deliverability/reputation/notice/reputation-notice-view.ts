import * as text from "../../../../kit/text.js";
import { ReputationNotice } from "./reputation-notice.js";

/** How screens and exports show a reputation notice. */
export class ReputationNoticeView {
  code: string;
  labelText: string;
  journeyId: string;
  region: string;
  utmSource: string;
  thresholdText: string;
  audienceId: string;
  ratio: string;
  checksum: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    journeyId: string,
    region: string,
    utmSource: string,
    thresholdText: string,
    audienceId: string,
    ratio: string,
    checksum: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.journeyId = journeyId;
    this.region = region;
    this.utmSource = utmSource;
    this.thresholdText = thresholdText;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.checksum = checksum;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toReputationNoticeView(item: ReputationNotice): ReputationNoticeView {
  return new ReputationNoticeView(
    item.code,
    item.label,
    item.journeyId,
    item.region,
    text.truncate(item.utmSource, 40),
    item.threshold.toFixed(2),
    text.truncate(item.audienceId, 80),
    item.ratio.toFixed(2),
    item.checksum,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationNoticeViews(items: ReputationNotice[]): ReputationNoticeView[] {
  const views: ReputationNoticeView[] = [];
  for (const item of items) {
    views.push(toReputationNoticeView(item));
  }
  return views;
}

export function sumReputationNoticeView(view: ReputationNoticeView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedThreshold + parsedRatio + parsedCost;
}
