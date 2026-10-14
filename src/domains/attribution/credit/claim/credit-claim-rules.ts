import * as text from "../../../../kit/text.js";
import { CreditClaim } from "./credit-claim.js";

/** A rule a credit claim must pass. Check returns its problems, or none. */
export interface CreditClaimRule {
  check(item: CreditClaim): string[];
}

export class CreditClaimCodePrefixRule implements CreditClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditClaimRequiredCodeRule implements CreditClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditClaimVisibleGuardRule implements CreditClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreditClaim): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CreditClaimAllowedLocaleRule implements CreditClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

/** Runs every rule of a credit claim. */
export class CreditClaimValidator {
  rules: CreditClaimRule[];

  constructor(rules: CreditClaimRule[]) {
    this.rules = rules;
  }

  validate(item: CreditClaim): string[] {
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

  requireValid(item: CreditClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditClaim[]): Map<string, string[]> {
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

export function defaultCreditClaimValidator(): CreditClaimValidator {
  return new CreditClaimValidator(
    [
      new CreditClaimCodePrefixRule("REF"),
      new CreditClaimRequiredCodeRule("credit claim needs this field"),
      new CreditClaimVisibleGuardRule(1000),
      new CreditClaimAllowedLocaleRule(["tiered", "strict", "pending"]),
    ],
  );
}
