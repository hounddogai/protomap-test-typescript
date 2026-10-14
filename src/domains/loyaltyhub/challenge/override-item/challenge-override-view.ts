import { ChallengeOverride } from "./challenge-override.js";

/** How screens and exports show a challenge override. */
export class ChallengeOverrideView {
  code: string;
  name: string;
  ratio: string;
  contactEmail: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ratio: string,
    contactEmail: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeOverrideView(item: ChallengeOverride): ChallengeOverrideView {
  return new ChallengeOverrideView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    item.contactEmail,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeOverrideViews(items: ChallengeOverride[]): ChallengeOverrideView[] {
  const views: ChallengeOverrideView[] = [];
  for (const item of items) {
    views.push(toChallengeOverrideView(item));
  }
  return views;
}

export function sumChallengeOverrideView(view: ChallengeOverrideView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
