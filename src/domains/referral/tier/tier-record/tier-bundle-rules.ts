import * as text from "../../../../kit/text.js";
import { TierBundle } from "./tier-bundle.js";

/** A rule a tier bundle must pass. Check returns its problems, or none. */
export interface TierBundleRule {
  check(item: TierBundle): string[];
}

export class TierBundleRequiredDescriptionRule implements TierBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierBundle): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class TierBundleAllowedRegionRule implements TierBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is unknown`];
    return [];
  }
}

export class TierBundleNameLengthRule implements TierBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierBundleApprovedGuardRule implements TierBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TierBundle): string[] {
    if (item.approved && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TierBundleStartsAtRangeRule implements TierBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierBundle): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tier bundle. */
export class TierBundleValidator {
  rules: TierBundleRule[];

  constructor(rules: TierBundleRule[]) {
    this.rules = rules;
  }

  validate(item: TierBundle): string[] {
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

  requireValid(item: TierBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierBundle[]): Map<string, string[]> {
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

export function defaultTierBundleValidator(): TierBundleValidator {
  return new TierBundleValidator(
    [
      new TierBundleRequiredDescriptionRule("tier bundle needs this field"),
      new TierBundleAllowedRegionRule([]),
      new TierBundleNameLengthRule(80),
      new TierBundleApprovedGuardRule(80),
      new TierBundleStartsAtRangeRule(80, 255),
    ],
  );
}
