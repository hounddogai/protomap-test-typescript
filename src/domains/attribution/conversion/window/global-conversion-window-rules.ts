import { GlobalConversionWindow } from "./global-conversion-window.js";

/** A rule a global conversion window must pass. Check returns its problems, or none. */
export interface GlobalConversionWindowRule {
  check(item: GlobalConversionWindow): string[];
}

export class GlobalConversionWindowDurationMinutesRangeRule implements GlobalConversionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalConversionWindow): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalConversionWindowLabelLengthRule implements GlobalConversionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalConversionWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalConversionWindowCodeLengthRule implements GlobalConversionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalConversionWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalConversionWindowRequiredLabelRule implements GlobalConversionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalConversionWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalConversionWindowRequiredCohortRule implements GlobalConversionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalConversionWindow): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global conversion window. */
export class GlobalConversionWindowValidator {
  rules: GlobalConversionWindowRule[];

  constructor(rules: GlobalConversionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalConversionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalConversionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalConversionWindow[]): Map<string, string[]> {
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

export function defaultGlobalConversionWindowValidator(): GlobalConversionWindowValidator {
  return new GlobalConversionWindowValidator(
    [
      new GlobalConversionWindowDurationMinutesRangeRule(64, 1000),
      new GlobalConversionWindowLabelLengthRule(32),
      new GlobalConversionWindowCodeLengthRule(120),
      new GlobalConversionWindowRequiredLabelRule("global conversion window needs an entry"),
      new GlobalConversionWindowRequiredCohortRule("global conversion window needs an entry"),
    ],
  );
}
