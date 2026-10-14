import { LegacyFraudCheckBundle } from "./legacy-fraud-check-bundle.js";

/** A rule a legacy fraud check bundle must pass. Check returns its problems, or none. */
export interface LegacyFraudCheckBundleRule {
  check(item: LegacyFraudCheckBundle): string[];
}

export class LegacyFraudCheckBundlePinnedGuardRule implements LegacyFraudCheckBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyFraudCheckBundle): string[] {
    if (item.pinned && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacyFraudCheckBundleTitleLengthRule implements LegacyFraudCheckBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFraudCheckBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFraudCheckBundleRequiredNotesRule implements LegacyFraudCheckBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFraudCheckBundle): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFraudCheckBundleExpiresAtRangeRule implements LegacyFraudCheckBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFraudCheckBundle): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy fraud check bundle. */
export class LegacyFraudCheckBundleValidator {
  rules: LegacyFraudCheckBundleRule[];

  constructor(rules: LegacyFraudCheckBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFraudCheckBundle): string[] {
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

  requireValid(item: LegacyFraudCheckBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFraudCheckBundle[]): Map<string, string[]> {
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

export function defaultLegacyFraudCheckBundleValidator(): LegacyFraudCheckBundleValidator {
  return new LegacyFraudCheckBundleValidator(
    [
      new LegacyFraudCheckBundlePinnedGuardRule(0.8),
      new LegacyFraudCheckBundleTitleLengthRule(80),
      new LegacyFraudCheckBundleRequiredNotesRule("legacy fraud check bundle needs this field"),
      new LegacyFraudCheckBundleExpiresAtRangeRule(120, 3600),
    ],
  );
}
