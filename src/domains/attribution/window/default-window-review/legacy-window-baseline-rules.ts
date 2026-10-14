import { LegacyWindowBaseline } from "./legacy-window-baseline.js";

/** A rule a legacy window baseline must pass. Check returns its problems, or none. */
export interface LegacyWindowBaselineRule {
  check(item: LegacyWindowBaseline): string[];
}

export class LegacyWindowBaselineLabelLengthRule implements LegacyWindowBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWindowBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWindowBaselineBudgetRangeRule implements LegacyWindowBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWindowBaseline): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyWindowBaselineRatioRangeRule implements LegacyWindowBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWindowBaseline): string[] {
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

/** Runs every rule of a legacy window baseline. */
export class LegacyWindowBaselineValidator {
  rules: LegacyWindowBaselineRule[];

  constructor(rules: LegacyWindowBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWindowBaseline): string[] {
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

  requireValid(item: LegacyWindowBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWindowBaseline[]): Map<string, string[]> {
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

export function defaultLegacyWindowBaselineValidator(): LegacyWindowBaselineValidator {
  return new LegacyWindowBaselineValidator(
    [
      new LegacyWindowBaselineLabelLengthRule(86400),
      new LegacyWindowBaselineBudgetRangeRule(4, 1000.6),
      new LegacyWindowBaselineRatioRangeRule(8.4, 3186.4),
    ],
  );
}
