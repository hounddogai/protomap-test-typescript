import { ActivationDraft } from "./activation-draft.js";

/** How screens and exports show a activation draft. */
export class ActivationDraftView {
  code: string;
  nameText: string;
  contactEmail: string;
  floorValue: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    contactEmail: string,
    floorValue: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toActivationDraftView(item: ActivationDraft): ActivationDraftView {
  return new ActivationDraftView(
    item.code,
    item.name,
    item.contactEmail,
    item.floorValue.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationDraftViews(items: ActivationDraft[]): ActivationDraftView[] {
  const views: ActivationDraftView[] = [];
  for (const item of items) {
    views.push(toActivationDraftView(item));
  }
  return views;
}

export function sumActivationDraftView(view: ActivationDraftView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFloorValue + parsedBudget;
}
