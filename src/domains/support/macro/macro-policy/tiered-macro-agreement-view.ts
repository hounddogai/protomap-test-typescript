import { TieredMacroAgreement } from "./tiered-macro-agreement.js";

/** How screens and exports show a tiered macro agreement. */
export class TieredMacroAgreementView {
  code: string;
  title: string;
  updatedAt: string;
  thresholdText: string;
  windowDays: string;
  rateText: string;
  batchSizeText: string;
  clicksText: string;
  scoreText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    updatedAt: string,
    thresholdText: string,
    windowDays: string,
    rateText: string,
    batchSizeText: string,
    clicksText: string,
    scoreText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.thresholdText = thresholdText;
    this.windowDays = windowDays;
    this.rateText = rateText;
    this.batchSizeText = batchSizeText;
    this.clicksText = clicksText;
    this.scoreText = scoreText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredMacroAgreementView(item: TieredMacroAgreement): TieredMacroAgreementView {
  return new TieredMacroAgreementView(
    item.code,
    item.title,
    String(item.updatedAt),
    item.threshold.toFixed(2),
    String(item.windowDays),
    item.rate.toFixed(2),
    String(item.batchSize),
    String(item.clicks),
    item.score.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredMacroAgreementViews(items: TieredMacroAgreement[]): TieredMacroAgreementView[] {
  const views: TieredMacroAgreementView[] = [];
  for (const item of items) {
    views.push(toTieredMacroAgreementView(item));
  }
  return views;
}

export function sumTieredMacroAgreementView(view: TieredMacroAgreementView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedUpdatedAt + parsedThreshold + parsedWindowDays;
}
