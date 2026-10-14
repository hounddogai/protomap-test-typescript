import { LegacyCohortClaim } from "./legacy-cohort-claim.js";

/** A rule a legacy cohort claim must pass. Check returns its problems, or none. */
export interface LegacyCohortClaimRule {
  check(item: LegacyCohortClaim): string[];
}

export class LegacyCohortClaimCodePrefixRule implements LegacyCohortClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyCohortClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyCohortClaimApprovedGuardRule implements LegacyCohortClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyCohortClaim): string[] {
    if (item.approved && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LegacyCohortClaimFloorValueRangeRule implements LegacyCohortClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCohortClaim): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyCohortClaimCodeLengthRule implements LegacyCohortClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCohortClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCohortClaimExpiresAtRangeRule implements LegacyCohortClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCohortClaim): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy cohort claim. */
export class LegacyCohortClaimValidator {
  rules: LegacyCohortClaimRule[];

  constructor(rules: LegacyCohortClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCohortClaim): string[] {
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

  requireValid(item: LegacyCohortClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCohortClaim[]): Map<string, string[]> {
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

export function defaultLegacyCohortClaimValidator(): LegacyCohortClaimValidator {
  return new LegacyCohortClaimValidator(
    [
      new LegacyCohortClaimCodePrefixRule("ACM"),
      new LegacyCohortClaimApprovedGuardRule(86400),
      new LegacyCohortClaimFloorValueRangeRule(4.3, 3306.5),
      new LegacyCohortClaimCodeLengthRule(80),
      new LegacyCohortClaimExpiresAtRangeRule(32, 255),
    ],
  );
}
