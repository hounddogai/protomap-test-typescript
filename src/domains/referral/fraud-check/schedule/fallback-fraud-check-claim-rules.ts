import { FallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

/** A rule a fallback fraud check claim must pass. Check returns its problems, or none. */
export interface FallbackFraudCheckClaimRule {
  check(item: FallbackFraudCheckClaim): string[];
}

export class FallbackFraudCheckClaimCodePrefixRule implements FallbackFraudCheckClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackFraudCheckClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackFraudCheckClaimTitleLengthRule implements FallbackFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFraudCheckClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFraudCheckClaimBudgetRangeRule implements FallbackFraudCheckClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFraudCheckClaim): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackFraudCheckClaimOwnerIdLengthRule implements FallbackFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFraudCheckClaim): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFraudCheckClaimRequiredOwnerIdRule implements FallbackFraudCheckClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFraudCheckClaim): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback fraud check claim. */
export class FallbackFraudCheckClaimValidator {
  rules: FallbackFraudCheckClaimRule[];

  constructor(rules: FallbackFraudCheckClaimRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFraudCheckClaim): string[] {
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

  requireValid(item: FallbackFraudCheckClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFraudCheckClaim[]): Map<string, string[]> {
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

export function defaultFallbackFraudCheckClaimValidator(): FallbackFraudCheckClaimValidator {
  return new FallbackFraudCheckClaimValidator(
    [
      new FallbackFraudCheckClaimCodePrefixRule("Q"),
      new FallbackFraudCheckClaimTitleLengthRule(255),
      new FallbackFraudCheckClaimBudgetRangeRule(7.7, 4488.4),
      new FallbackFraudCheckClaimOwnerIdLengthRule(86400),
      new FallbackFraudCheckClaimRequiredOwnerIdRule("fallback fraud check claim needs an entry"),
    ],
  );
}
