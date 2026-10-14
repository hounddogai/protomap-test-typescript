import * as text from "../../../../kit/text.js";
import { FallbackSenderRollup } from "./fallback-sender-rollup.js";

/** How screens and exports show a fallback sender rollup. */
export class FallbackSenderRollupView {
  code: string;
  label: string;
  segment: string;
  ratio: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segment: string,
    ratio: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.ratio = ratio;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSenderRollupView(item: FallbackSenderRollup): FallbackSenderRollupView {
  return new FallbackSenderRollupView(
    item.code,
    item.label,
    text.truncate(item.segment, 64),
    item.ratio.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSenderRollupViews(items: FallbackSenderRollup[]): FallbackSenderRollupView[] {
  const views: FallbackSenderRollupView[] = [];
  for (const item of items) {
    views.push(toFallbackSenderRollupView(item));
  }
  return views;
}

export function sumFallbackSenderRollupView(view: FallbackSenderRollupView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRatio + parsedFrequencyCap;
}
