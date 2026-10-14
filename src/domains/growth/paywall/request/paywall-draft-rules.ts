import { PaywallDraft } from "./paywall-draft.js";

/** A rule a paywall draft must pass. Check returns its problems, or none. */
export interface PaywallDraftRule {
  check(item: PaywallDraft): string[];
}

export class PaywallDraftCodePrefixRule implements PaywallDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallDraftNameLengthRule implements PaywallDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallDraftRequiredLabelRule implements PaywallDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallDraftDescriptionLengthRule implements PaywallDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallDraft): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallDraftRequiredNameRule implements PaywallDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallDraftRequiredDescriptionRule implements PaywallDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallDraft): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall draft. */
export class PaywallDraftValidator {
  rules: PaywallDraftRule[];

  constructor(rules: PaywallDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: PaywallDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallDraft[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultPaywallDraftValidator(): PaywallDraftValidator {
  return new PaywallDraftValidator(
    [
      new PaywallDraftCodePrefixRule("OPS"),
      new PaywallDraftNameLengthRule(1000),
      new PaywallDraftRequiredLabelRule("paywall draft needs an entry"),
      new PaywallDraftDescriptionLengthRule(1000),
      new PaywallDraftRequiredNameRule("paywall draft needs a value"),
      new PaywallDraftRequiredDescriptionRule("paywall draft needs a value"),
    ],
  );
}
