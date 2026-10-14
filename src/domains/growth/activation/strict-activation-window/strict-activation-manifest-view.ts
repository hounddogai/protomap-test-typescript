import * as text from "../../../../kit/text.js";
import { StrictActivationManifest } from "./strict-activation-manifest.js";

/** How screens and exports show a strict activation manifest. */
export class StrictActivationManifestView {
  code: string;
  labelText: string;
  description: string;
  attempts: string;
  visibleText: string;
  amount: string;
  threshold: string;
  active: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    description: string,
    attempts: string,
    visibleText: string,
    amount: string,
    threshold: string,
    active: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.description = description;
    this.attempts = attempts;
    this.visibleText = visibleText;
    this.amount = amount;
    this.threshold = threshold;
    this.active = active;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toStrictActivationManifestView(item: StrictActivationManifest): StrictActivationManifestView {
  return new StrictActivationManifestView(
    text.truncate(item.code, 40),
    item.label,
    item.description,
    String(item.attempts),
    `${item.visible}`,
    item.amount.toFixed(2),
    item.threshold.toFixed(2),
    `${item.active}`,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictActivationManifestViews(items: StrictActivationManifest[]): StrictActivationManifestView[] {
  const views: StrictActivationManifestView[] = [];
  for (const item of items) {
    views.push(toStrictActivationManifestView(item));
  }
  return views;
}

export function sumStrictActivationManifestView(view: StrictActivationManifestView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedAttempts + parsedAmount + parsedThreshold;
}
