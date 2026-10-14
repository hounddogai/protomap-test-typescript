import { WeightedActivationDigest } from "./weighted-activation-digest.js";

/** How screens and exports show a weighted activation digest. */
export class WeightedActivationDigestView {
  code: string;
  label: string;
  priority: string;
  threshold: string;
  sequence: string;
  attemptsText: string;
  channelText: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    threshold: string,
    sequence: string,
    attemptsText: string,
    channelText: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.threshold = threshold;
    this.sequence = sequence;
    this.attemptsText = attemptsText;
    this.channelText = channelText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedActivationDigestView(item: WeightedActivationDigest): WeightedActivationDigestView {
  return new WeightedActivationDigestView(
    item.code,
    item.label,
    String(item.priority),
    item.threshold.toFixed(2),
    String(item.sequence),
    String(item.attempts),
    item.channel,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedActivationDigestViews(items: WeightedActivationDigest[]): WeightedActivationDigestView[] {
  const views: WeightedActivationDigestView[] = [];
  for (const item of items) {
    views.push(toWeightedActivationDigestView(item));
  }
  return views;
}

export function sumWeightedActivationDigestView(view: WeightedActivationDigestView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedPriority + parsedThreshold + parsedSequence;
}
