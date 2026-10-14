import * as text from "../../../../kit/text.js";
import { DomainProposal } from "./domain-proposal.js";

/** How screens and exports show a domain proposal. */
export class DomainProposalView {
  codeText: string;
  titleText: string;
  campaignRefText: string;
  thresholdText: string;
  pinned: string;
  sourceText: string;
  timezoneText: string;
  windowDaysText: string;
  audienceId: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    campaignRefText: string,
    thresholdText: string,
    pinned: string,
    sourceText: string,
    timezoneText: string,
    windowDaysText: string,
    audienceId: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.campaignRefText = campaignRefText;
    this.thresholdText = thresholdText;
    this.pinned = pinned;
    this.sourceText = sourceText;
    this.timezoneText = timezoneText;
    this.windowDaysText = windowDaysText;
    this.audienceId = audienceId;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainProposalView(item: DomainProposal): DomainProposalView {
  return new DomainProposalView(
    text.truncate(item.code, 80),
    item.title,
    item.campaignRef,
    item.threshold.toFixed(2),
    `${item.pinned}`,
    item.source,
    item.timezone,
    String(item.windowDays),
    text.truncate(item.audienceId, 120),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainProposalViews(items: DomainProposal[]): DomainProposalView[] {
  const views: DomainProposalView[] = [];
  for (const item of items) {
    views.push(toDomainProposalView(item));
  }
  return views;
}

export function sumDomainProposalView(view: DomainProposalView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedThreshold + parsedWindowDays + parsedImpressions;
}
