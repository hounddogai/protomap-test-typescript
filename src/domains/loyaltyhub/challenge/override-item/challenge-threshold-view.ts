import * as text from "../../../../kit/text.js";
import { ChallengeThreshold } from "./challenge-threshold.js";

/** How screens and exports show a challenge threshold. */
export class ChallengeThresholdView {
  code: string;
  name: string;
  variant: string;
  description: string;
  journeyIdText: string;
  contactEmail: string;
  visible: string;
  campaignRef: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    variant: string,
    description: string,
    journeyIdText: string,
    contactEmail: string,
    visible: string,
    campaignRef: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.description = description;
    this.journeyIdText = journeyIdText;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeThresholdView(item: ChallengeThreshold): ChallengeThresholdView {
  return new ChallengeThresholdView(
    item.code,
    item.name,
    text.truncate(item.variant, 64),
    item.description,
    item.journeyId,
    item.contactEmail,
    `${item.visible}`,
    text.truncate(item.campaignRef, 40),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeThresholdViews(items: ChallengeThreshold[]): ChallengeThresholdView[] {
  const views: ChallengeThresholdView[] = [];
  for (const item of items) {
    views.push(toChallengeThresholdView(item));
  }
  return views;
}

export function sumChallengeThresholdView(view: ChallengeThresholdView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
