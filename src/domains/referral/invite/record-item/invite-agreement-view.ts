import * as text from "../../../../kit/text.js";
import { InviteAgreement } from "./invite-agreement.js";

/** How screens and exports show a invite agreement. */
export class InviteAgreementView {
  code: string;
  label: string;
  budget: string;
  region: string;
  segment: string;
  statusLabel: string;

  constructor(code: string, label: string, budget: string, region: string, segment: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.region = region;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toInviteAgreementView(item: InviteAgreement): InviteAgreementView {
  return new InviteAgreementView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    item.budget.toFixed(2),
    text.truncate(item.region, 120),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteAgreementViews(items: InviteAgreement[]): InviteAgreementView[] {
  const views: InviteAgreementView[] = [];
  for (const item of items) {
    views.push(toInviteAgreementView(item));
  }
  return views;
}

export function sumInviteAgreementView(view: InviteAgreementView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
