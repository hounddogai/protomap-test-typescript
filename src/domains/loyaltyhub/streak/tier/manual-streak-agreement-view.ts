import { ManualStreakAgreement } from "./manual-streak-agreement.js";

/** How screens and exports show a manual streak agreement. */
export class ManualStreakAgreementView {
  codeText: string;
  titleText: string;
  version: string;
  threshold: string;
  campaignRef: string;
  maximumText: string;
  minimum: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    version: string,
    threshold: string,
    campaignRef: string,
    maximumText: string,
    minimum: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.version = version;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.maximumText = maximumText;
    this.minimum = minimum;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toManualStreakAgreementView(item: ManualStreakAgreement): ManualStreakAgreementView {
  return new ManualStreakAgreementView(
    item.code,
    item.title,
    String(item.version),
    item.threshold.toFixed(2),
    item.campaignRef,
    item.maximum.toFixed(2),
    item.minimum.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualStreakAgreementViews(items: ManualStreakAgreement[]): ManualStreakAgreementView[] {
  const views: ManualStreakAgreementView[] = [];
  for (const item of items) {
    views.push(toManualStreakAgreementView(item));
  }
  return views;
}

export function sumManualStreakAgreementView(view: ManualStreakAgreementView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedVersion + parsedThreshold + parsedMaximum;
}
