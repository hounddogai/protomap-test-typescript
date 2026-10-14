import * as text from "../../../../kit/text.js";
import { WeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

/** A rule a weighted domain snapshot must pass. Check returns its problems, or none. */
export interface WeightedDomainSnapshotRule {
  check(item: WeightedDomainSnapshot): string[];
}

export class WeightedDomainSnapshotAllowedCountryRule implements WeightedDomainSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedDomainSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is duplicated`];
    return [];
  }
}

export class WeightedDomainSnapshotRequiredCountryRule implements WeightedDomainSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDomainSnapshot): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDomainSnapshotRequiredCodeRule implements WeightedDomainSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDomainSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDomainSnapshotCountryLengthRule implements WeightedDomainSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDomainSnapshot): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDomainSnapshotActiveGuardRule implements WeightedDomainSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedDomainSnapshot): string[] {
    if (item.active && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while active`];
    return [];
  }
}

export class WeightedDomainSnapshotRequiredTitleRule implements WeightedDomainSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDomainSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted domain snapshot. */
export class WeightedDomainSnapshotValidator {
  rules: WeightedDomainSnapshotRule[];

  constructor(rules: WeightedDomainSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDomainSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedDomainSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDomainSnapshot[]): Map<string, string[]> {
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

export function defaultWeightedDomainSnapshotValidator(): WeightedDomainSnapshotValidator {
  return new WeightedDomainSnapshotValidator(
    [
      new WeightedDomainSnapshotAllowedCountryRule([]),
      new WeightedDomainSnapshotRequiredCountryRule("weighted domain snapshot needs an entry"),
      new WeightedDomainSnapshotRequiredCodeRule("weighted domain snapshot needs an entry"),
      new WeightedDomainSnapshotCountryLengthRule(120),
      new WeightedDomainSnapshotActiveGuardRule(32),
      new WeightedDomainSnapshotRequiredTitleRule("weighted domain snapshot needs this field"),
    ],
  );
}
