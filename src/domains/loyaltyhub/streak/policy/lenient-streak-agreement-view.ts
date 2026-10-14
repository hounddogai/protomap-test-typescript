import * as text from "../../../../kit/text.js";
import { LenientStreakAgreement } from "./lenient-streak-agreement.js";

/** How screens and exports show a lenient streak agreement. */
export class LenientStreakAgreementView {
  code: string;
  label: string;
  ceiling: string;
  approved: string;
  sequence: string;
  name: string;
  expiresAt: string;
  ratio: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceiling: string,
    approved: string,
    sequence: string,
    name: string,
    expiresAt: string,
    ratio: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.approved = approved;
    this.sequence = sequence;
    this.name = name;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toLenientStreakAgreementView(item: LenientStreakAgreement): LenientStreakAgreementView {
  return new LenientStreakAgreementView(
    item.code,
    text.truncate(item.label, 120),
    item.ceiling.toFixed(2),
    `${item.approved}`,
    String(item.sequence),
    item.name,
    String(item.expiresAt),
    item.ratio.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientStreakAgreementViews(items: LenientStreakAgreement[]): LenientStreakAgreementView[] {
  const views: LenientStreakAgreementView[] = [];
  for (const item of items) {
    views.push(toLenientStreakAgreementView(item));
  }
  return views;
}

export function sumLenientStreakAgreementView(view: LenientStreakAgreementView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCeiling + parsedSequence + parsedExpiresAt;
}
