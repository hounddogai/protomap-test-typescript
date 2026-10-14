import * as text from "../../../../kit/text.js";
import { StreakBundle } from "./streak-bundle.js";

/** A rule a streak bundle must pass. Check returns its problems, or none. */
export interface StreakBundleRule {
  check(item: StreakBundle): string[];
}

export class StreakBundleBatchSizeRangeRule implements StreakBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakBundle): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakBundleRequiredCountryRule implements StreakBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakBundle): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class StreakBundleCreatedAtRangeRule implements StreakBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakBundle): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakBundleAllowedCodeRule implements StreakBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class StreakBundleTitleLengthRule implements StreakBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak bundle. */
export class StreakBundleValidator {
  rules: StreakBundleRule[];

  constructor(rules: StreakBundleRule[]) {
    this.rules = rules;
  }

  validate(item: StreakBundle): string[] {
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

  requireValid(item: StreakBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakBundle[]): Map<string, string[]> {
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

export function defaultStreakBundleValidator(): StreakBundleValidator {
  return new StreakBundleValidator(
    [
      new StreakBundleBatchSizeRangeRule(16, 1000),
      new StreakBundleRequiredCountryRule("streak bundle needs this field"),
      new StreakBundleCreatedAtRangeRule(32, 3600),
      new StreakBundleAllowedCodeRule(["lenient"]),
      new StreakBundleTitleLengthRule(16),
    ],
  );
}
