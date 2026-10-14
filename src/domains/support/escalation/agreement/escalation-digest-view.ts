import * as text from "../../../../kit/text.js";
import { EscalationDigest } from "./escalation-digest.js";

/** How screens and exports show a escalation digest. */
export class EscalationDigestView {
  code: string;
  label: string;
  revisionText: string;
  contactEmail: string;
  margin: string;
  sourceText: string;
  attempts: string;
  frequencyCap: string;
  notes: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revisionText: string,
    contactEmail: string,
    margin: string,
    sourceText: string,
    attempts: string,
    frequencyCap: string,
    notes: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revisionText = revisionText;
    this.contactEmail = contactEmail;
    this.margin = margin;
    this.sourceText = sourceText;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationDigestView(item: EscalationDigest): EscalationDigestView {
  return new EscalationDigestView(
    item.code,
    item.label,
    String(item.revision),
    item.contactEmail,
    item.margin.toFixed(2),
    text.truncate(item.source, 40),
    String(item.attempts),
    String(item.frequencyCap),
    item.notes,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationDigestViews(items: EscalationDigest[]): EscalationDigestView[] {
  const views: EscalationDigestView[] = [];
  for (const item of items) {
    views.push(toEscalationDigestView(item));
  }
  return views;
}

export function sumEscalationDigestView(view: EscalationDigestView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedRevision + parsedMargin + parsedAttempts;
}
