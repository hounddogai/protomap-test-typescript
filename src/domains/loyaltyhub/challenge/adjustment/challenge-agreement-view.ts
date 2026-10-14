import * as text from "../../../../kit/text.js";
import { ChallengeAgreement } from "./challenge-agreement.js";

/** How screens and exports show a challenge agreement. */
export class ChallengeAgreementView {
  code: string;
  name: string;
  regionText: string;
  country: string;
  audienceId: string;
  sequence: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    regionText: string,
    country: string,
    audienceId: string,
    sequence: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.regionText = regionText;
    this.country = country;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeAgreementView(item: ChallengeAgreement): ChallengeAgreementView {
  return new ChallengeAgreementView(
    item.code,
    item.name,
    item.region,
    text.truncate(item.country, 64),
    item.audienceId,
    String(item.sequence),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeAgreementViews(items: ChallengeAgreement[]): ChallengeAgreementView[] {
  const views: ChallengeAgreementView[] = [];
  for (const item of items) {
    views.push(toChallengeAgreementView(item));
  }
  return views;
}

export function sumChallengeAgreementView(view: ChallengeAgreementView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedSequence + parsedOpenRate;
}
