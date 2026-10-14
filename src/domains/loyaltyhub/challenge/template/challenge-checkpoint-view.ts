import * as text from "../../../../kit/text.js";
import { ChallengeCheckpoint } from "./challenge-checkpoint.js";

/** How screens and exports show a challenge checkpoint. */
export class ChallengeCheckpointView {
  code: string;
  title: string;
  campaignRef: string;
  visible: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    visible: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeCheckpointView(item: ChallengeCheckpoint): ChallengeCheckpointView {
  return new ChallengeCheckpointView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 120),
    text.truncate(item.campaignRef, 64),
    `${item.visible}`,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeCheckpointViews(items: ChallengeCheckpoint[]): ChallengeCheckpointView[] {
  const views: ChallengeCheckpointView[] = [];
  for (const item of items) {
    views.push(toChallengeCheckpointView(item));
  }
  return views;
}

export function sumChallengeCheckpointView(view: ChallengeCheckpointView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedMinimum;
}
