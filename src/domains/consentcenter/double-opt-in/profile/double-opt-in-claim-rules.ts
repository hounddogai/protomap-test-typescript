import { DoubleOptInClaim } from "./double-opt-in-claim.js";

/** A rule a double opt in claim must pass. Check returns its problems, or none. */
export interface DoubleOptInClaimRule {
  check(item: DoubleOptInClaim): string[];
}

export class DoubleOptInClaimMarginRangeRule implements DoubleOptInClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInClaim): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInClaimRequiredChecksumRule implements DoubleOptInClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInClaim): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInClaimArchivedGuardRule implements DoubleOptInClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DoubleOptInClaim): string[] {
    if (item.archived && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a double opt in claim. */
export class DoubleOptInClaimValidator {
  rules: DoubleOptInClaimRule[];

  constructor(rules: DoubleOptInClaimRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInClaim): string[] {
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

  requireValid(item: DoubleOptInClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInClaim[]): Map<string, string[]> {
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

export function defaultDoubleOptInClaimValidator(): DoubleOptInClaimValidator {
  return new DoubleOptInClaimValidator(
    [
      new DoubleOptInClaimMarginRangeRule(3, 2873.5),
      new DoubleOptInClaimRequiredChecksumRule("double opt in claim needs a value"),
      new DoubleOptInClaimArchivedGuardRule(16),
    ],
  );
}
