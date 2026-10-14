import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeProposal } from "./adaptive-challenge-proposal.js";

/** How screens and exports show a adaptive challenge proposal. */
export class AdaptiveChallengeProposalView {
  codeText: string;
  name: string;
  summary: string;
  durationMinutesText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    summary: string,
    durationMinutesText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.summary = summary;
    this.durationMinutesText = durationMinutesText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveChallengeProposalView(item: AdaptiveChallengeProposal): AdaptiveChallengeProposalView {
  return new AdaptiveChallengeProposalView(
    text.truncate(item.code, 64),
    item.name,
    item.summary,
    String(item.durationMinutes),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveChallengeProposalViews(items: AdaptiveChallengeProposal[]): AdaptiveChallengeProposalView[] {
  const views: AdaptiveChallengeProposalView[] = [];
  for (const item of items) {
    views.push(toAdaptiveChallengeProposalView(item));
  }
  return views;
}

export function sumAdaptiveChallengeProposalView(view: AdaptiveChallengeProposalView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedDurationMinutes + parsedFrequencyCap;
}
