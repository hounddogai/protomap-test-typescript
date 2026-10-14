import * as text from "../../../../kit/text.js";
import { PayoutManifest } from "./payout-manifest.js";

/** A rule a payout manifest must pass. Check returns its problems, or none. */
export interface PayoutManifestRule {
  check(item: PayoutManifest): string[];
}

export class PayoutManifestAllowedCodeRule implements PayoutManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class PayoutManifestRequiredLabelRule implements PayoutManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutManifestRequiredReviewerRule implements PayoutManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutManifest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutManifestCodePrefixRule implements PayoutManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a payout manifest. */
export class PayoutManifestValidator {
  rules: PayoutManifestRule[];

  constructor(rules: PayoutManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutManifest): string[] {
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

  requireValid(item: PayoutManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutManifest[]): Map<string, string[]> {
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

export function defaultPayoutManifestValidator(): PayoutManifestValidator {
  return new PayoutManifestValidator(
    [
      new PayoutManifestAllowedCodeRule([]),
      new PayoutManifestRequiredLabelRule("payout manifest needs this field"),
      new PayoutManifestRequiredReviewerRule("payout manifest needs this field"),
      new PayoutManifestCodePrefixRule("Q"),
    ],
  );
}
