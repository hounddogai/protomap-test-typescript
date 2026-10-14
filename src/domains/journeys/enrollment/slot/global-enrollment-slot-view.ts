import { GlobalEnrollmentSlot } from "./global-enrollment-slot.js";

/** How screens and exports show a global enrollment slot. */
export class GlobalEnrollmentSlotView {
  codeText: string;
  title: string;
  externalRef: string;
  budget: string;
  ownerIdText: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    externalRef: string,
    budget: string,
    ownerIdText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.externalRef = externalRef;
    this.budget = budget;
    this.ownerIdText = ownerIdText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalEnrollmentSlotView(item: GlobalEnrollmentSlot): GlobalEnrollmentSlotView {
  return new GlobalEnrollmentSlotView(
    item.code,
    item.title,
    item.externalRef,
    item.budget.toFixed(2),
    item.ownerId,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalEnrollmentSlotViews(items: GlobalEnrollmentSlot[]): GlobalEnrollmentSlotView[] {
  const views: GlobalEnrollmentSlotView[] = [];
  for (const item of items) {
    views.push(toGlobalEnrollmentSlotView(item));
  }
  return views;
}

export function sumGlobalEnrollmentSlotView(view: GlobalEnrollmentSlotView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBudget + parsedRetries;
}
