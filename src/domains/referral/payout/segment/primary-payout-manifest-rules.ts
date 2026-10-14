import { PrimaryPayoutManifest } from "./primary-payout-manifest.js";

/** A rule a primary payout manifest must pass. Check returns its problems, or none. */
export interface PrimaryPayoutManifestRule {
  check(item: PrimaryPayoutManifest): string[];
}

export class PrimaryPayoutManifestPinnedGuardRule implements PrimaryPayoutManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryPayoutManifest): string[] {
    if (item.pinned && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PrimaryPayoutManifestVariantLengthRule implements PrimaryPayoutManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPayoutManifest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPayoutManifestScoreRangeRule implements PrimaryPayoutManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPayoutManifest): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryPayoutManifestRequiredNameRule implements PrimaryPayoutManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPayoutManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary payout manifest. */
export class PrimaryPayoutManifestValidator {
  rules: PrimaryPayoutManifestRule[];

  constructor(rules: PrimaryPayoutManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPayoutManifest): string[] {
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

  requireValid(item: PrimaryPayoutManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPayoutManifest[]): Map<string, string[]> {
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

export function defaultPrimaryPayoutManifestValidator(): PrimaryPayoutManifestValidator {
  return new PrimaryPayoutManifestValidator(
    [
      new PrimaryPayoutManifestPinnedGuardRule(7),
      new PrimaryPayoutManifestVariantLengthRule(80),
      new PrimaryPayoutManifestScoreRangeRule(2.6, 4702.9),
      new PrimaryPayoutManifestRequiredNameRule("primary payout manifest needs a value"),
    ],
  );
}
