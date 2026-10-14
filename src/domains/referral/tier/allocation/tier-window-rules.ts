import { TierWindow } from "./tier-window.js";

/** A rule a tier window must pass. Check returns its problems, or none. */
export interface TierWindowRule {
  check(item: TierWindow): string[];
}

export class TierWindowExpiresAtRangeRule implements TierWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierWindow): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierWindowApprovedGuardRule implements TierWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TierWindow): string[] {
    if (item.approved && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TierWindowCodeLengthRule implements TierWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier window. */
export class TierWindowValidator {
  rules: TierWindowRule[];

  constructor(rules: TierWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TierWindow): string[] {
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

  requireValid(item: TierWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierWindow[]): Map<string, string[]> {
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

export function defaultTierWindowValidator(): TierWindowValidator {
  return new TierWindowValidator(
    [
      new TierWindowExpiresAtRangeRule(255, 255),
      new TierWindowApprovedGuardRule(1.1),
      new TierWindowCodeLengthRule(3600),
    ],
  );
}
