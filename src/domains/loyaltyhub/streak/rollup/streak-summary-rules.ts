import { StreakSummary } from "./streak-summary.js";

/** A rule a streak summary must pass. Check returns its problems, or none. */
export interface StreakSummaryRule {
  check(item: StreakSummary): string[];
}

export class StreakSummaryRequiredCodeRule implements StreakSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakSummaryConversionRateRangeRule implements StreakSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakSummary): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakSummaryWindowDaysRangeRule implements StreakSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakSummary): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakSummaryCodeLengthRule implements StreakSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakSummaryCodePrefixRule implements StreakSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a streak summary. */
export class StreakSummaryValidator {
  rules: StreakSummaryRule[];

  constructor(rules: StreakSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: StreakSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakSummary[]): Map<string, string[]> {
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

export function defaultStreakSummaryValidator(): StreakSummaryValidator {
  return new StreakSummaryValidator(
    [
      new StreakSummaryRequiredCodeRule("streak summary needs a value"),
      new StreakSummaryConversionRateRangeRule(8.3, 1938.4),
      new StreakSummaryWindowDaysRangeRule(80, 120),
      new StreakSummaryCodeLengthRule(80),
      new StreakSummaryCodePrefixRule("REF"),
    ],
  );
}
