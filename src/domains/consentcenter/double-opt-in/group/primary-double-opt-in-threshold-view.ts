import * as text from "../../../../kit/text.js";
import { PrimaryDoubleOptInThreshold } from "./primary-double-opt-in-threshold.js";

/** How screens and exports show a primary double opt in threshold. */
export class PrimaryDoubleOptInThresholdView {
  codeText: string;
  titleText: string;
  visible: string;
  channelText: string;
  sourceText: string;
  frequencyCap: string;
  approved: string;
  contactEmail: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    visible: string,
    channelText: string,
    sourceText: string,
    frequencyCap: string,
    approved: string,
    contactEmail: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.visible = visible;
    this.channelText = channelText;
    this.sourceText = sourceText;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryDoubleOptInThresholdView(item: PrimaryDoubleOptInThreshold): PrimaryDoubleOptInThresholdView {
  return new PrimaryDoubleOptInThresholdView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 120),
    `${item.visible}`,
    item.channel,
    item.source,
    String(item.frequencyCap),
    `${item.approved}`,
    item.contactEmail,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryDoubleOptInThresholdViews(items: PrimaryDoubleOptInThreshold[]): PrimaryDoubleOptInThresholdView[] {
  const views: PrimaryDoubleOptInThresholdView[] = [];
  for (const item of items) {
    views.push(toPrimaryDoubleOptInThresholdView(item));
  }
  return views;
}

export function sumPrimaryDoubleOptInThresholdView(view: PrimaryDoubleOptInThresholdView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedFrequencyCap + parsedVersion;
}
