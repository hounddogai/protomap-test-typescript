import * as text from "../../../../kit/text.js";
import { DomainGroup } from "./domain-group.js";

/** How screens and exports show a domain group. */
export class DomainGroupView {
  code: string;
  labelText: string;
  expiresAtText: string;
  cohort: string;
  currency: string;
  notesText: string;
  sequence: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    expiresAtText: string,
    cohort: string,
    currency: string,
    notesText: string,
    sequence: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.expiresAtText = expiresAtText;
    this.cohort = cohort;
    this.currency = currency;
    this.notesText = notesText;
    this.sequence = sequence;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toDomainGroupView(item: DomainGroup): DomainGroupView {
  return new DomainGroupView(
    item.code,
    item.label,
    String(item.expiresAt),
    text.truncate(item.cohort, 80),
    text.truncate(item.currency, 80),
    text.truncate(item.notes, 64),
    String(item.sequence),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainGroupViews(items: DomainGroup[]): DomainGroupView[] {
  const views: DomainGroupView[] = [];
  for (const item of items) {
    views.push(toDomainGroupView(item));
  }
  return views;
}

export function sumDomainGroupView(view: DomainGroupView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedExpiresAt + parsedSequence;
}
