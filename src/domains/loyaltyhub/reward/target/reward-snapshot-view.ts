import * as text from "../../../../kit/text.js";
import { RewardSnapshot } from "./reward-snapshot.js";

/** How screens and exports show a reward snapshot. */
export class RewardSnapshotView {
  codeText: string;
  label: string;
  version: string;
  channelText: string;
  name: string;
  visible: string;
  rate: string;
  variant: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    version: string,
    channelText: string,
    name: string,
    visible: string,
    rate: string,
    variant: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.version = version;
    this.channelText = channelText;
    this.name = name;
    this.visible = visible;
    this.rate = rate;
    this.variant = variant;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardSnapshotView(item: RewardSnapshot): RewardSnapshotView {
  return new RewardSnapshotView(
    item.code,
    item.label,
    String(item.version),
    item.channel,
    item.name,
    `${item.visible}`,
    item.rate.toFixed(2),
    text.truncate(item.variant, 64),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardSnapshotViews(items: RewardSnapshot[]): RewardSnapshotView[] {
  const views: RewardSnapshotView[] = [];
  for (const item of items) {
    views.push(toRewardSnapshotView(item));
  }
  return views;
}

export function sumRewardSnapshotView(view: RewardSnapshotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedVersion + parsedRate + parsedSequence;
}
