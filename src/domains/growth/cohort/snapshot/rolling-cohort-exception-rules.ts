import { RollingCohortException } from "./rolling-cohort-exception.js";

/** A rule a rolling cohort exception must pass. Check returns its problems, or none. */
export interface RollingCohortExceptionRule {
  check(item: RollingCohortException): string[];
}

export class RollingCohortExceptionCodePrefixRule implements RollingCohortExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingCohortException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingCohortExceptionNameLengthRule implements RollingCohortExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCohortException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCohortExceptionCodeLengthRule implements RollingCohortExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCohortException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCohortExceptionRequiredNameRule implements RollingCohortExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCohortException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCohortExceptionDurationMinutesRangeRule implements RollingCohortExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCohortException): string[] {
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

/** Runs every rule of a rolling cohort exception. */
export class RollingCohortExceptionValidator {
  rules: RollingCohortExceptionRule[];

  constructor(rules: RollingCohortExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCohortException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingCohortException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCohortException[]): Map<string, string[]> {
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

export function defaultRollingCohortExceptionValidator(): RollingCohortExceptionValidator {
  return new RollingCohortExceptionValidator(
    [
      new RollingCohortExceptionCodePrefixRule("ACM"),
      new RollingCohortExceptionNameLengthRule(120),
      new RollingCohortExceptionCodeLengthRule(80),
      new RollingCohortExceptionRequiredNameRule("rolling cohort exception needs this field"),
      new RollingCohortExceptionDurationMinutesRangeRule(32, 120),
    ],
  );
}
