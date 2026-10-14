import { PendingCreditEstimate } from "./pending-credit-estimate.js";

/** A rule a pending credit estimate must pass. Check returns its problems, or none. */
export interface PendingCreditEstimateRule {
  check(item: PendingCreditEstimate): string[];
}

export class PendingCreditEstimateCodePrefixRule implements PendingCreditEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingCreditEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingCreditEstimateActiveGuardRule implements PendingCreditEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingCreditEstimate): string[] {
    if (item.active && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PendingCreditEstimateLabelLengthRule implements PendingCreditEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreditEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending credit estimate. */
export class PendingCreditEstimateValidator {
  rules: PendingCreditEstimateRule[];

  constructor(rules: PendingCreditEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCreditEstimate): string[] {
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

  requireValid(item: PendingCreditEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCreditEstimate[]): Map<string, string[]> {
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

export function defaultPendingCreditEstimateValidator(): PendingCreditEstimateValidator {
  return new PendingCreditEstimateValidator(
    [
      new PendingCreditEstimateCodePrefixRule("X"),
      new PendingCreditEstimateActiveGuardRule(16),
      new PendingCreditEstimateLabelLengthRule(86400),
    ],
  );
}
