import { ManualPreferenceBaseline } from "./manual-preference-baseline.js";

/** A rule a manual preference baseline must pass. Check returns its problems, or none. */
export interface ManualPreferenceBaselineRule {
  check(item: ManualPreferenceBaseline): string[];
}

export class ManualPreferenceBaselineRequiredDescriptionRule implements ManualPreferenceBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceBaseline): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPreferenceBaselineRatioRangeRule implements ManualPreferenceBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPreferenceBaseline): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualPreferenceBaselineCodeLengthRule implements ManualPreferenceBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPreferenceBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPreferenceBaselineRequiredTitleRule implements ManualPreferenceBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual preference baseline. */
export class ManualPreferenceBaselineValidator {
  rules: ManualPreferenceBaselineRule[];

  constructor(rules: ManualPreferenceBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPreferenceBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPreferenceBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPreferenceBaseline[]): Map<string, string[]> {
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

export function defaultManualPreferenceBaselineValidator(): ManualPreferenceBaselineValidator {
  return new ManualPreferenceBaselineValidator(
    [
      new ManualPreferenceBaselineRequiredDescriptionRule("manual preference baseline needs a value"),
      new ManualPreferenceBaselineRatioRangeRule(2.7, 4322.1),
      new ManualPreferenceBaselineCodeLengthRule(80),
      new ManualPreferenceBaselineRequiredTitleRule("manual preference baseline needs a value"),
    ],
  );
}
