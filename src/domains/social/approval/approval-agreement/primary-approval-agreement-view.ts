import * as text from "../../../../kit/text.js";
import { PrimaryApprovalAgreement } from "./primary-approval-agreement.js";

/** How screens and exports show a primary approval agreement. */
export class PrimaryApprovalAgreementView {
  code: string;
  name: string;
  visible: string;
  locale: string;
  channel: string;
  priority: string;
  currencyText: string;
  contactEmailText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    locale: string,
    channel: string,
    priority: string,
    currencyText: string,
    contactEmailText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.locale = locale;
    this.channel = channel;
    this.priority = priority;
    this.currencyText = currencyText;
    this.contactEmailText = contactEmailText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryApprovalAgreementView(item: PrimaryApprovalAgreement): PrimaryApprovalAgreementView {
  return new PrimaryApprovalAgreementView(
    item.code,
    item.name,
    `${item.visible}`,
    text.truncate(item.locale, 40),
    text.truncate(item.channel, 80),
    String(item.priority),
    item.currency,
    item.contactEmail,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryApprovalAgreementViews(items: PrimaryApprovalAgreement[]): PrimaryApprovalAgreementView[] {
  const views: PrimaryApprovalAgreementView[] = [];
  for (const item of items) {
    views.push(toPrimaryApprovalAgreementView(item));
  }
  return views;
}

export function sumPrimaryApprovalAgreementView(view: PrimaryApprovalAgreementView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedPriority + parsedBudget;
}
