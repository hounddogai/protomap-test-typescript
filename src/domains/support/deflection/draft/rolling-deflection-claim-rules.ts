import { RollingDeflectionClaim } from "./rolling-deflection-claim.js";

/** A rule a rolling deflection claim must pass. Check returns its problems, or none. */
export interface RollingDeflectionClaimRule {
  check(item: RollingDeflectionClaim): string[];
}

export class RollingDeflectionClaimCodePrefixRule implements RollingDeflectionClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingDeflectionClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingDeflectionClaimActiveGuardRule implements RollingDeflectionClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingDeflectionClaim): string[] {
    if (item.active && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RollingDeflectionClaimCodeLengthRule implements RollingDeflectionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDeflectionClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingDeflectionClaimGraceDaysRangeRule implements RollingDeflectionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDeflectionClaim): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingDeflectionClaimEndsAtRangeRule implements RollingDeflectionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDeflectionClaim): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling deflection claim. */
export class RollingDeflectionClaimValidator {
  rules: RollingDeflectionClaimRule[];

  constructor(rules: RollingDeflectionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RollingDeflectionClaim): string[] {
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

  requireValid(item: RollingDeflectionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingDeflectionClaim[]): Map<string, string[]> {
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

export function defaultRollingDeflectionClaimValidator(): RollingDeflectionClaimValidator {
  return new RollingDeflectionClaimValidator(
    [
      new RollingDeflectionClaimCodePrefixRule("REF"),
      new RollingDeflectionClaimActiveGuardRule(255),
      new RollingDeflectionClaimCodeLengthRule(64),
      new RollingDeflectionClaimGraceDaysRangeRule(64, 86400),
      new RollingDeflectionClaimEndsAtRangeRule(64, 86400),
    ],
  );
}
