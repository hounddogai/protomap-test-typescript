import * as text from "../../../../kit/text.js";
import { LenientWaitPolicy } from "./lenient-wait-policy.js";

/** How screens and exports show a lenient wait policy. */
export class LenientWaitPolicyView {
  codeText: string;
  titleText: string;
  segmentText: string;
  sequence: string;
  notes: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    segmentText: string,
    sequence: string,
    notes: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.segmentText = segmentText;
    this.sequence = sequence;
    this.notes = notes;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toLenientWaitPolicyView(item: LenientWaitPolicy): LenientWaitPolicyView {
  return new LenientWaitPolicyView(
    item.code,
    text.truncate(item.title, 40),
    text.truncate(item.segment, 64),
    String(item.sequence),
    item.notes,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientWaitPolicyViews(items: LenientWaitPolicy[]): LenientWaitPolicyView[] {
  const views: LenientWaitPolicyView[] = [];
  for (const item of items) {
    views.push(toLenientWaitPolicyView(item));
  }
  return views;
}

export function sumLenientWaitPolicyView(view: LenientWaitPolicyView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
