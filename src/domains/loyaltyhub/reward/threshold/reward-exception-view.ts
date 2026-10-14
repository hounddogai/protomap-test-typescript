import * as text from "../../../../kit/text.js";
import { RewardException } from "./reward-exception.js";

/** How screens and exports show a reward exception. */
export class RewardExceptionView {
  code: string;
  label: string;
  phone: string;
  name: string;
  budgetText: string;
  startsAt: string;
  contactEmail: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    phone: string,
    name: string,
    budgetText: string,
    startsAt: string,
    contactEmail: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.name = name;
    this.budgetText = budgetText;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toRewardExceptionView(item: RewardException): RewardExceptionView {
  return new RewardExceptionView(
    text.truncate(item.code, 40),
    item.label,
    item.phone,
    text.truncate(item.name, 120),
    item.budget.toFixed(2),
    String(item.startsAt),
    item.contactEmail,
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardExceptionViews(items: RewardException[]): RewardExceptionView[] {
  const views: RewardExceptionView[] = [];
  for (const item of items) {
    views.push(toRewardExceptionView(item));
  }
  return views;
}

export function sumRewardExceptionView(view: RewardExceptionView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBudget + parsedStartsAt;
}
