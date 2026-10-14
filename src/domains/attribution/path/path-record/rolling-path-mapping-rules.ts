import { RollingPathMapping } from "./rolling-path-mapping.js";

/** A rule a rolling path mapping must pass. Check returns its problems, or none. */
export interface RollingPathMappingRule {
  check(item: RollingPathMapping): string[];
}

export class RollingPathMappingLabelLengthRule implements RollingPathMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPathMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPathMappingCohortLengthRule implements RollingPathMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPathMapping): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPathMappingRateRangeRule implements RollingPathMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPathMapping): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling path mapping. */
export class RollingPathMappingValidator {
  rules: RollingPathMappingRule[];

  constructor(rules: RollingPathMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPathMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPathMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPathMapping[]): Map<string, string[]> {
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

export function defaultRollingPathMappingValidator(): RollingPathMappingValidator {
  return new RollingPathMappingValidator(
    [
      new RollingPathMappingLabelLengthRule(255),
      new RollingPathMappingCohortLengthRule(120),
      new RollingPathMappingRateRangeRule(4.7, 3038.2),
    ],
  );
}
