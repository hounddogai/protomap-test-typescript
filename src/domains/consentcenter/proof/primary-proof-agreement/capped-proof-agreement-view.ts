import * as text from "../../../../kit/text.js";
import { CappedProofAgreement } from "./capped-proof-agreement.js";

/** How screens and exports show a capped proof agreement. */
export class CappedProofAgreementView {
  code: string;
  nameText: string;
  endsAt: string;
  budgetText: string;
  source: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    endsAt: string,
    budgetText: string,
    source: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.endsAt = endsAt;
    this.budgetText = budgetText;
    this.source = source;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toCappedProofAgreementView(item: CappedProofAgreement): CappedProofAgreementView {
  return new CappedProofAgreementView(
    item.code,
    item.name,
    String(item.endsAt),
    item.budget.toFixed(2),
    text.truncate(item.source, 80),
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedProofAgreementViews(items: CappedProofAgreement[]): CappedProofAgreementView[] {
  const views: CappedProofAgreementView[] = [];
  for (const item of items) {
    views.push(toCappedProofAgreementView(item));
  }
  return views;
}

export function sumCappedProofAgreementView(view: CappedProofAgreementView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedEndsAt + parsedBudget;
}
