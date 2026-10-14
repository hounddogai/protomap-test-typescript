import * as text from "../../../../kit/text.js";
import { RollingJourneyAgreement } from "./rolling-journey-agreement.js";

/** How screens and exports show a rolling journey agreement. */
export class RollingJourneyAgreementView {
  codeText: string;
  titleText: string;
  journeyIdText: string;
  batchSizeText: string;
  graceDays: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    journeyIdText: string,
    batchSizeText: string,
    graceDays: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.journeyIdText = journeyIdText;
    this.batchSizeText = batchSizeText;
    this.graceDays = graceDays;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toRollingJourneyAgreementView(item: RollingJourneyAgreement): RollingJourneyAgreementView {
  return new RollingJourneyAgreementView(
    item.code,
    item.title,
    text.truncate(item.journeyId, 80),
    String(item.batchSize),
    String(item.graceDays),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingJourneyAgreementViews(items: RollingJourneyAgreement[]): RollingJourneyAgreementView[] {
  const views: RollingJourneyAgreementView[] = [];
  for (const item of items) {
    views.push(toRollingJourneyAgreementView(item));
  }
  return views;
}

export function sumRollingJourneyAgreementView(view: RollingJourneyAgreementView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedBatchSize + parsedGraceDays;
}
