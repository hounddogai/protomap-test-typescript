import * as text from "../../../../kit/text.js";
import { LenientDoubleOptInBundle } from "./lenient-double-opt-in-bundle.js";

/** A rule a lenient double opt in bundle must pass. Check returns its problems, or none. */
export interface LenientDoubleOptInBundleRule {
  check(item: LenientDoubleOptInBundle): string[];
}

export class LenientDoubleOptInBundleCodePrefixRule implements LenientDoubleOptInBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientDoubleOptInBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientDoubleOptInBundleRequiredReviewerRule implements LenientDoubleOptInBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDoubleOptInBundle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDoubleOptInBundleGraceDaysRangeRule implements LenientDoubleOptInBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientDoubleOptInBundle): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientDoubleOptInBundleAllowedReviewerRule implements LenientDoubleOptInBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientDoubleOptInBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is blocked`];
    return [];
  }
}

/** Runs every rule of a lenient double opt in bundle. */
export class LenientDoubleOptInBundleValidator {
  rules: LenientDoubleOptInBundleRule[];

  constructor(rules: LenientDoubleOptInBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDoubleOptInBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientDoubleOptInBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDoubleOptInBundle[]): Map<string, string[]> {
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

export function defaultLenientDoubleOptInBundleValidator(): LenientDoubleOptInBundleValidator {
  return new LenientDoubleOptInBundleValidator(
    [
      new LenientDoubleOptInBundleCodePrefixRule("OPS"),
      new LenientDoubleOptInBundleRequiredReviewerRule("lenient double opt in bundle needs a value"),
      new LenientDoubleOptInBundleGraceDaysRangeRule(255, 255),
      new LenientDoubleOptInBundleAllowedReviewerRule(["seasonal"]),
    ],
  );
}
