import * as text from "../../../../kit/text.js";
import { PreferenceBaseline } from "./preference-baseline.js";

/** A rule a preference baseline must pass. Check returns its problems, or none. */
export interface PreferenceBaselineRule {
  check(item: PreferenceBaseline): string[];
}

export class PreferenceBaselineRequiredReviewerRule implements PreferenceBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceBaseline): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceBaselineRetriesRangeRule implements PreferenceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceBaseline): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceBaselineAllowedCodeRule implements PreferenceBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a preference baseline. */
export class PreferenceBaselineValidator {
  rules: PreferenceBaselineRule[];

  constructor(rules: PreferenceBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceBaseline[]): Map<string, string[]> {
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

export function defaultPreferenceBaselineValidator(): PreferenceBaselineValidator {
  return new PreferenceBaselineValidator(
    [
      new PreferenceBaselineRequiredReviewerRule("preference baseline needs a value"),
      new PreferenceBaselineRetriesRangeRule(16, 86400),
      new PreferenceBaselineAllowedCodeRule(["regional", "default", "lenient"]),
    ],
  );
}
