import * as text from "../../../../kit/text.js";
import { ChallengeBaseline } from "./challenge-baseline.js";

/** How screens and exports show a challenge baseline. */
export class ChallengeBaselineView {
  code: string;
  label: string;
  phone: string;
  ratio: string;
  segmentText: string;
  threshold: string;
  versionText: string;
  descriptionText: string;
  startsAtText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    phone: string,
    ratio: string,
    segmentText: string,
    threshold: string,
    versionText: string,
    descriptionText: string,
    startsAtText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.ratio = ratio;
    this.segmentText = segmentText;
    this.threshold = threshold;
    this.versionText = versionText;
    this.descriptionText = descriptionText;
    this.startsAtText = startsAtText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeBaselineView(item: ChallengeBaseline): ChallengeBaselineView {
  return new ChallengeBaselineView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.phone, 120),
    item.ratio.toFixed(2),
    item.segment,
    item.threshold.toFixed(2),
    String(item.version),
    item.description,
    String(item.startsAt),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeBaselineViews(items: ChallengeBaseline[]): ChallengeBaselineView[] {
  const views: ChallengeBaselineView[] = [];
  for (const item of items) {
    views.push(toChallengeBaselineView(item));
  }
  return views;
}

export function sumChallengeBaselineView(view: ChallengeBaselineView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedRatio + parsedThreshold + parsedVersion;
}
