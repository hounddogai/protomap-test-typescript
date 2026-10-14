import { EnrollmentThreshold } from "./enrollment-threshold.js";

/** How screens and exports show a enrollment threshold. */
export class EnrollmentThresholdView {
  code: string;
  name: string;
  capacityText: string;
  country: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacityText: string,
    country: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacityText = capacityText;
    this.country = country;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentThresholdView(item: EnrollmentThreshold): EnrollmentThresholdView {
  return new EnrollmentThresholdView(
    item.code,
    item.name,
    String(item.capacity),
    item.country,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentThresholdViews(items: EnrollmentThreshold[]): EnrollmentThresholdView[] {
  const views: EnrollmentThresholdView[] = [];
  for (const item of items) {
    views.push(toEnrollmentThresholdView(item));
  }
  return views;
}

export function sumEnrollmentThresholdView(view: EnrollmentThresholdView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedCapacity + parsedQuantity;
}
