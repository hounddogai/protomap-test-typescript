import * as text from "../../../../kit/text.js";
import { MacroVariance } from "./macro-variance.js";

/** How screens and exports show a macro variance. */
export class MacroVarianceView {
  code: string;
  labelText: string;
  variantText: string;
  sequence: string;
  channel: string;
  visibleText: string;
  campaignRef: string;
  segment: string;
  sourceText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    variantText: string,
    sequence: string,
    channel: string,
    visibleText: string,
    campaignRef: string,
    segment: string,
    sourceText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.variantText = variantText;
    this.sequence = sequence;
    this.channel = channel;
    this.visibleText = visibleText;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.sourceText = sourceText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toMacroVarianceView(item: MacroVariance): MacroVarianceView {
  return new MacroVarianceView(
    item.code,
    text.truncate(item.label, 64),
    item.variant,
    String(item.sequence),
    item.channel,
    `${item.visible}`,
    text.truncate(item.campaignRef, 120),
    item.segment,
    item.source,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroVarianceViews(items: MacroVariance[]): MacroVarianceView[] {
  const views: MacroVarianceView[] = [];
  for (const item of items) {
    views.push(toMacroVarianceView(item));
  }
  return views;
}

export function sumMacroVarianceView(view: MacroVarianceView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedSequence + parsedThreshold;
}
