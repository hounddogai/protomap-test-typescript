import * as text from "../../../../kit/text.js";
import { CsatProfile } from "./csat-profile.js";

/** How screens and exports show a csat profile. */
export class CsatProfileView {
  codeText: string;
  title: string;
  ratio: string;
  sequence: string;
  checksum: string;
  budget: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ratio: string,
    sequence: string,
    checksum: string,
    budget: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ratio = ratio;
    this.sequence = sequence;
    this.checksum = checksum;
    this.budget = budget;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toCsatProfileView(item: CsatProfile): CsatProfileView {
  return new CsatProfileView(
    item.code,
    item.title,
    item.ratio.toFixed(2),
    String(item.sequence),
    text.truncate(item.checksum, 40),
    item.budget.toFixed(2),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatProfileViews(items: CsatProfile[]): CsatProfileView[] {
  const views: CsatProfileView[] = [];
  for (const item of items) {
    views.push(toCsatProfileView(item));
  }
  return views;
}

export function sumCsatProfileView(view: CsatProfileView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedSequence + parsedBudget;
}
