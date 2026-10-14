import * as text from "../../../../kit/text.js";
import { ChallengeRollup } from "./challenge-rollup.js";

/** How screens and exports show a challenge rollup. */
export class ChallengeRollupView {
  code: string;
  nameText: string;
  country: string;
  label: string;
  weight: string;
  description: string;
  sendAt: string;
  utmSource: string;
  visible: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    country: string,
    label: string,
    weight: string,
    description: string,
    sendAt: string,
    utmSource: string,
    visible: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.country = country;
    this.label = label;
    this.weight = weight;
    this.description = description;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.visible = visible;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeRollupView(item: ChallengeRollup): ChallengeRollupView {
  return new ChallengeRollupView(
    text.truncate(item.code, 64),
    item.name,
    item.country,
    text.truncate(item.label, 80),
    item.weight.toFixed(2),
    item.description,
    String(item.sendAt),
    text.truncate(item.utmSource, 80),
    `${item.visible}`,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeRollupViews(items: ChallengeRollup[]): ChallengeRollupView[] {
  const views: ChallengeRollupView[] = [];
  for (const item of items) {
    views.push(toChallengeRollupView(item));
  }
  return views;
}

export function sumChallengeRollupView(view: ChallengeRollupView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedWeight + parsedSendAt + parsedGraceDays;
}
