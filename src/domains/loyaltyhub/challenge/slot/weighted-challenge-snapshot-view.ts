import { WeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

/** How screens and exports show a weighted challenge snapshot. */
export class WeightedChallengeSnapshotView {
  code: string;
  nameText: string;
  revision: string;
  amount: string;
  countryText: string;
  floorValue: string;
  channel: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    revision: string,
    amount: string,
    countryText: string,
    floorValue: string,
    channel: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.revision = revision;
    this.amount = amount;
    this.countryText = countryText;
    this.floorValue = floorValue;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedChallengeSnapshotView(item: WeightedChallengeSnapshot): WeightedChallengeSnapshotView {
  return new WeightedChallengeSnapshotView(
    item.code,
    item.name,
    String(item.revision),
    item.amount.toFixed(2),
    item.country,
    item.floorValue.toFixed(2),
    item.channel,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedChallengeSnapshotViews(items: WeightedChallengeSnapshot[]): WeightedChallengeSnapshotView[] {
  const views: WeightedChallengeSnapshotView[] = [];
  for (const item of items) {
    views.push(toWeightedChallengeSnapshotView(item));
  }
  return views;
}

export function sumWeightedChallengeSnapshotView(view: WeightedChallengeSnapshotView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedRevision + parsedAmount + parsedFloorValue;
}
