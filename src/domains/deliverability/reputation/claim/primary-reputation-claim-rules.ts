import * as text from "../../../../kit/text.js";
import { PrimaryReputationClaim } from "./primary-reputation-claim.js";

/** A rule a primary reputation claim must pass. Check returns its problems, or none. */
export interface PrimaryReputationClaimRule {
  check(item: PrimaryReputationClaim): string[];
}

export class PrimaryReputationClaimAllowedPhoneRule implements PrimaryReputationClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryReputationClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is expired`];
    return [];
  }
}

export class PrimaryReputationClaimRequiredTitleRule implements PrimaryReputationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryReputationClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryReputationClaimCodePrefixRule implements PrimaryReputationClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryReputationClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryReputationClaimUpdatedAtRangeRule implements PrimaryReputationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryReputationClaim): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryReputationClaimStartsAtRangeRule implements PrimaryReputationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryReputationClaim): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary reputation claim. */
export class PrimaryReputationClaimValidator {
  rules: PrimaryReputationClaimRule[];

  constructor(rules: PrimaryReputationClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryReputationClaim): string[] {
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

  requireValid(item: PrimaryReputationClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryReputationClaim[]): Map<string, string[]> {
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

export function defaultPrimaryReputationClaimValidator(): PrimaryReputationClaimValidator {
  return new PrimaryReputationClaimValidator(
    [
      new PrimaryReputationClaimAllowedPhoneRule([]),
      new PrimaryReputationClaimRequiredTitleRule("primary reputation claim needs an entry"),
      new PrimaryReputationClaimCodePrefixRule("X"),
      new PrimaryReputationClaimUpdatedAtRangeRule(32, 3600),
      new PrimaryReputationClaimStartsAtRangeRule(32, 120),
    ],
  );
}
