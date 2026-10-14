import { AdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

/** How screens and exports show a adaptive exit rule bundle. */
export class AdaptiveExitRuleBundleView {
  code: string;
  nameText: string;
  contactEmail: string;
  weightText: string;
  sequence: string;
  phone: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    contactEmail: string,
    weightText: string,
    sequence: string,
    phone: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.contactEmail = contactEmail;
    this.weightText = weightText;
    this.sequence = sequence;
    this.phone = phone;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveExitRuleBundleView(item: AdaptiveExitRuleBundle): AdaptiveExitRuleBundleView {
  return new AdaptiveExitRuleBundleView(
    item.code,
    item.name,
    item.contactEmail,
    item.weight.toFixed(2),
    String(item.sequence),
    item.phone,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveExitRuleBundleViews(items: AdaptiveExitRuleBundle[]): AdaptiveExitRuleBundleView[] {
  const views: AdaptiveExitRuleBundleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveExitRuleBundleView(item));
  }
  return views;
}

export function sumAdaptiveExitRuleBundleView(view: AdaptiveExitRuleBundleView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedWeight + parsedSequence + parsedAttempts;
}
