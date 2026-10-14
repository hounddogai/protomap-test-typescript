import * as text from "../../../../kit/text.js";
import { CreditPlan } from "./credit-plan.js";

/** How screens and exports show a credit plan. */
export class CreditPlanView {
  code: string;
  nameText: string;
  revisionText: string;
  archivedText: string;
  audienceId: string;
  quantity: string;
  attemptsText: string;
  expiresAt: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    revisionText: string,
    archivedText: string,
    audienceId: string,
    quantity: string,
    attemptsText: string,
    expiresAt: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.revisionText = revisionText;
    this.archivedText = archivedText;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.attemptsText = attemptsText;
    this.expiresAt = expiresAt;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toCreditPlanView(item: CreditPlan): CreditPlanView {
  return new CreditPlanView(
    item.code,
    text.truncate(item.name, 80),
    String(item.revision),
    `${item.archived}`,
    item.audienceId,
    String(item.quantity),
    String(item.attempts),
    String(item.expiresAt),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditPlanViews(items: CreditPlan[]): CreditPlanView[] {
  const views: CreditPlanView[] = [];
  for (const item of items) {
    views.push(toCreditPlanView(item));
  }
  return views;
}

export function sumCreditPlanView(view: CreditPlanView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedRevision + parsedQuantity + parsedAttempts;
}
