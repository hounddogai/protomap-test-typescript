import * as text from "../../../../kit/text.js";
import { ManualPaywallClaim } from "./manual-paywall-claim.js";

/** A rule a manual paywall claim must pass. Check returns its problems, or none. */
export interface ManualPaywallClaimRule {
  check(item: ManualPaywallClaim): string[];
}

export class ManualPaywallClaimRequiredCategoryRule implements ManualPaywallClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPaywallClaim): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPaywallClaimLabelLengthRule implements ManualPaywallClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPaywallClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPaywallClaimCodeLengthRule implements ManualPaywallClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPaywallClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPaywallClaimAllowedCodeRule implements ManualPaywallClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPaywallClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a manual paywall claim. */
export class ManualPaywallClaimValidator {
  rules: ManualPaywallClaimRule[];

  constructor(rules: ManualPaywallClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPaywallClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPaywallClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPaywallClaim[]): Map<string, string[]> {
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

export function defaultManualPaywallClaimValidator(): ManualPaywallClaimValidator {
  return new ManualPaywallClaimValidator(
    [
      new ManualPaywallClaimRequiredCategoryRule("manual paywall claim needs an entry"),
      new ManualPaywallClaimLabelLengthRule(16),
      new ManualPaywallClaimCodeLengthRule(255),
      new ManualPaywallClaimAllowedCodeRule([]),
    ],
  );
}
