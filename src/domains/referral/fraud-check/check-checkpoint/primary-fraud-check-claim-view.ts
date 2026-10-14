import * as text from "../../../../kit/text.js";
import { PrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

/** How screens and exports show a primary fraud check claim. */
export class PrimaryFraudCheckClaimView {
  code: string;
  label: string;
  capacityText: string;
  conversionRate: string;
  priority: string;
  contactEmail: string;
  revision: string;
  nameText: string;
  version: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacityText: string,
    conversionRate: string,
    priority: string,
    contactEmail: string,
    revision: string,
    nameText: string,
    version: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacityText = capacityText;
    this.conversionRate = conversionRate;
    this.priority = priority;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.nameText = nameText;
    this.version = version;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFraudCheckClaimView(item: PrimaryFraudCheckClaim): PrimaryFraudCheckClaimView {
  return new PrimaryFraudCheckClaimView(
    text.truncate(item.code, 80),
    item.label,
    String(item.capacity),
    item.conversionRate.toFixed(2),
    String(item.priority),
    item.contactEmail,
    String(item.revision),
    item.name,
    String(item.version),
    text.truncate(item.description, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFraudCheckClaimViews(items: PrimaryFraudCheckClaim[]): PrimaryFraudCheckClaimView[] {
  const views: PrimaryFraudCheckClaimView[] = [];
  for (const item of items) {
    views.push(toPrimaryFraudCheckClaimView(item));
  }
  return views;
}

export function sumPrimaryFraudCheckClaimView(view: PrimaryFraudCheckClaimView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedCapacity + parsedConversionRate + parsedPriority;
}
