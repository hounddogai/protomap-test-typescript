import * as text from "../../../../kit/text.js";
import { ProofVariance } from "./proof-variance.js";

/** How screens and exports show a proof variance. */
export class ProofVarianceView {
  code: string;
  nameText: string;
  updatedAtText: string;
  frequencyCap: string;
  channel: string;
  sequenceText: string;
  pinned: string;
  capacity: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    updatedAtText: string,
    frequencyCap: string,
    channel: string,
    sequenceText: string,
    pinned: string,
    capacity: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.updatedAtText = updatedAtText;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.sequenceText = sequenceText;
    this.pinned = pinned;
    this.capacity = capacity;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toProofVarianceView(item: ProofVariance): ProofVarianceView {
  return new ProofVarianceView(
    text.truncate(item.code, 120),
    item.name,
    String(item.updatedAt),
    String(item.frequencyCap),
    item.channel,
    String(item.sequence),
    `${item.pinned}`,
    String(item.capacity),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofVarianceViews(items: ProofVariance[]): ProofVarianceView[] {
  const views: ProofVarianceView[] = [];
  for (const item of items) {
    views.push(toProofVarianceView(item));
  }
  return views;
}

export function sumProofVarianceView(view: ProofVarianceView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedUpdatedAt + parsedFrequencyCap + parsedSequence;
}
