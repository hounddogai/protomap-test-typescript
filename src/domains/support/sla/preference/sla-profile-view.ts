import { SlaProfile } from "./sla-profile.js";

/** How screens and exports show a sla profile. */
export class SlaProfileView {
  code: string;
  nameText: string;
  budgetText: string;
  notes: string;
  updatedAt: string;
  quantity: string;
  sendAt: string;
  journeyId: string;
  threshold: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budgetText: string,
    notes: string,
    updatedAt: string,
    quantity: string,
    sendAt: string,
    journeyId: string,
    threshold: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budgetText = budgetText;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.quantity = quantity;
    this.sendAt = sendAt;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toSlaProfileView(item: SlaProfile): SlaProfileView {
  return new SlaProfileView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    item.notes,
    String(item.updatedAt),
    String(item.quantity),
    String(item.sendAt),
    item.journeyId,
    item.threshold.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaProfileViews(items: SlaProfile[]): SlaProfileView[] {
  const views: SlaProfileView[] = [];
  for (const item of items) {
    views.push(toSlaProfileView(item));
  }
  return views;
}

export function sumSlaProfileView(view: SlaProfileView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedBudget + parsedUpdatedAt + parsedQuantity;
}
