import * as text from "../../../../kit/text.js";
import { FallbackCreditSegment } from "./fallback-credit-segment.js";

/** How screens and exports show a fallback credit segment. */
export class FallbackCreditSegmentView {
  codeText: string;
  label: string;
  graceDays: string;
  sequence: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    graceDays: string,
    sequence: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreditSegmentView(item: FallbackCreditSegment): FallbackCreditSegmentView {
  return new FallbackCreditSegmentView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    String(item.graceDays),
    String(item.sequence),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreditSegmentViews(items: FallbackCreditSegment[]): FallbackCreditSegmentView[] {
  const views: FallbackCreditSegmentView[] = [];
  for (const item of items) {
    views.push(toFallbackCreditSegmentView(item));
  }
  return views;
}

export function sumFallbackCreditSegmentView(view: FallbackCreditSegmentView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedGraceDays + parsedSequence + parsedFrequencyCap;
}
