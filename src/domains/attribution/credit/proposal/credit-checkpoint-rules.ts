import * as text from "../../../../kit/text.js";
import { CreditCheckpoint } from "./credit-checkpoint.js";

/** A rule a credit checkpoint must pass. Check returns its problems, or none. */
export interface CreditCheckpointRule {
  check(item: CreditCheckpoint): string[];
}

export class CreditCheckpointAllowedCohortRule implements CreditCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is stale`];
    return [];
  }
}

export class CreditCheckpointCurrencyLengthRule implements CreditCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditCheckpoint): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditCheckpointCodePrefixRule implements CreditCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit checkpoint. */
export class CreditCheckpointValidator {
  rules: CreditCheckpointRule[];

  constructor(rules: CreditCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: CreditCheckpoint): string[] {
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

  requireValid(item: CreditCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditCheckpoint[]): Map<string, string[]> {
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

export function defaultCreditCheckpointValidator(): CreditCheckpointValidator {
  return new CreditCheckpointValidator(
    [
      new CreditCheckpointAllowedCohortRule(["lenient"]),
      new CreditCheckpointCurrencyLengthRule(16),
      new CreditCheckpointCodePrefixRule("REF"),
    ],
  );
}
