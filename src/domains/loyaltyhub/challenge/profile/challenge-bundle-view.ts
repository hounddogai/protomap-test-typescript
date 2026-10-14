import { ChallengeBundle } from "./challenge-bundle.js";

/** How screens and exports show a challenge bundle. */
export class ChallengeBundleView {
  code: string;
  nameText: string;
  graceDays: string;
  floorValue: string;
  utmSource: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    graceDays: string,
    floorValue: string,
    utmSource: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.utmSource = utmSource;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeBundleView(item: ChallengeBundle): ChallengeBundleView {
  return new ChallengeBundleView(
    item.code,
    item.name,
    String(item.graceDays),
    item.floorValue.toFixed(2),
    item.utmSource,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeBundleViews(items: ChallengeBundle[]): ChallengeBundleView[] {
  const views: ChallengeBundleView[] = [];
  for (const item of items) {
    views.push(toChallengeBundleView(item));
  }
  return views;
}

export function sumChallengeBundleView(view: ChallengeBundleView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedGraceDays + parsedFloorValue;
}
