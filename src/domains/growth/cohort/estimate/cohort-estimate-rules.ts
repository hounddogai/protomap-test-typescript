import { CohortEstimate } from "./cohort-estimate.js";

/** A rule a cohort estimate must pass. Check returns its problems, or none. */
export interface CohortEstimateRule {
  check(item: CohortEstimate): string[];
}

export class CohortEstimateNameLengthRule implements CohortEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortEstimateCodePrefixRule implements CohortEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortEstimateCodeLengthRule implements CohortEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortEstimateDurationMinutesRangeRule implements CohortEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortEstimate): string[] {
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

export class CohortEstimateRequiredCodeRule implements CohortEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort estimate. */
export class CohortEstimateValidator {
  rules: CohortEstimateRule[];

  constructor(rules: CohortEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: CohortEstimate): string[] {
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

  requireValid(item: CohortEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortEstimate[]): Map<string, string[]> {
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

export function defaultCohortEstimateValidator(): CohortEstimateValidator {
  return new CohortEstimateValidator(
    [
      new CohortEstimateNameLengthRule(3600),
      new CohortEstimateCodePrefixRule("ACM"),
      new CohortEstimateCodeLengthRule(80),
      new CohortEstimateDurationMinutesRangeRule(255, 1000),
      new CohortEstimateRequiredCodeRule("cohort estimate needs a value"),
    ],
  );
}
