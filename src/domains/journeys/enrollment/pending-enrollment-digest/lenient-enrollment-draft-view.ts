import * as text from "../../../../kit/text.js";
import { LenientEnrollmentDraft } from "./lenient-enrollment-draft.js";

/** How screens and exports show a lenient enrollment draft. */
export class LenientEnrollmentDraftView {
  codeText: string;
  nameText: string;
  sequence: string;
  ratio: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    sequence: string,
    ratio: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.sequence = sequence;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientEnrollmentDraftView(item: LenientEnrollmentDraft): LenientEnrollmentDraftView {
  return new LenientEnrollmentDraftView(
    text.truncate(item.code, 120),
    item.name,
    String(item.sequence),
    item.ratio.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientEnrollmentDraftViews(items: LenientEnrollmentDraft[]): LenientEnrollmentDraftView[] {
  const views: LenientEnrollmentDraftView[] = [];
  for (const item of items) {
    views.push(toLenientEnrollmentDraftView(item));
  }
  return views;
}

export function sumLenientEnrollmentDraftView(view: LenientEnrollmentDraftView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedSequence + parsedRatio + parsedCreatedAt;
}
