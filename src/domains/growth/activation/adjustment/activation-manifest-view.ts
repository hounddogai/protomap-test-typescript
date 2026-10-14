import * as text from "../../../../kit/text.js";
import { ActivationManifest } from "./activation-manifest.js";

/** How screens and exports show a activation manifest. */
export class ActivationManifestView {
  code: string;
  labelText: string;
  channel: string;
  titleText: string;
  frequencyCap: string;
  createdAt: string;
  sequence: string;
  pinned: string;
  summary: string;
  score: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    titleText: string,
    frequencyCap: string,
    createdAt: string,
    sequence: string,
    pinned: string,
    summary: string,
    score: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.sequence = sequence;
    this.pinned = pinned;
    this.summary = summary;
    this.score = score;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toActivationManifestView(item: ActivationManifest): ActivationManifestView {
  return new ActivationManifestView(
    item.code,
    item.label,
    item.channel,
    item.title,
    String(item.frequencyCap),
    String(item.createdAt),
    String(item.sequence),
    `${item.pinned}`,
    item.summary,
    item.score.toFixed(2),
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationManifestViews(items: ActivationManifest[]): ActivationManifestView[] {
  const views: ActivationManifestView[] = [];
  for (const item of items) {
    views.push(toActivationManifestView(item));
  }
  return views;
}

export function sumActivationManifestView(view: ActivationManifestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedFrequencyCap + parsedCreatedAt + parsedSequence;
}
