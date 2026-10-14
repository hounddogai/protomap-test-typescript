import * as text from "../../../../kit/text.js";
import { CreditAssignment } from "./credit-assignment.js";

/** How screens and exports show a credit assignment. */
export class CreditAssignmentView {
  code: string;
  title: string;
  cohortText: string;
  expiresAt: string;
  sequenceText: string;
  attemptsText: string;
  contactEmail: string;
  summary: string;
  archivedText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohortText: string,
    expiresAt: string,
    sequenceText: string,
    attemptsText: string,
    contactEmail: string,
    summary: string,
    archivedText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohortText = cohortText;
    this.expiresAt = expiresAt;
    this.sequenceText = sequenceText;
    this.attemptsText = attemptsText;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.archivedText = archivedText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditAssignmentView(item: CreditAssignment): CreditAssignmentView {
  return new CreditAssignmentView(
    item.code,
    text.truncate(item.title, 40),
    item.cohort,
    String(item.expiresAt),
    String(item.sequence),
    String(item.attempts),
    item.contactEmail,
    item.summary,
    `${item.archived}`,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditAssignmentViews(items: CreditAssignment[]): CreditAssignmentView[] {
  const views: CreditAssignmentView[] = [];
  for (const item of items) {
    views.push(toCreditAssignmentView(item));
  }
  return views;
}

export function sumCreditAssignmentView(view: CreditAssignmentView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedExpiresAt + parsedSequence + parsedAttempts;
}
