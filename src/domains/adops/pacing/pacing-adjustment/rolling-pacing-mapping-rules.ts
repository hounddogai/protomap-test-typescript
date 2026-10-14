import { RollingPacingMapping } from "./rolling-pacing-mapping.js";

/** A rule a rolling pacing mapping must pass. Check returns its problems, or none. */
export interface RollingPacingMappingRule {
  check(item: RollingPacingMapping): string[];
}

export class RollingPacingMappingLabelLengthRule implements RollingPacingMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingMappingLimitRangeRule implements RollingPacingMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPacingMapping): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPacingMappingUpdatedAtRangeRule implements RollingPacingMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPacingMapping): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling pacing mapping. */
export class RollingPacingMappingValidator {
  rules: RollingPacingMappingRule[];

  constructor(rules: RollingPacingMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPacingMapping): string[] {
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

  requireValid(item: RollingPacingMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPacingMapping[]): Map<string, string[]> {
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

export function defaultRollingPacingMappingValidator(): RollingPacingMappingValidator {
  return new RollingPacingMappingValidator(
    [
      new RollingPacingMappingLabelLengthRule(120),
      new RollingPacingMappingLimitRangeRule(1000, 86400),
      new RollingPacingMappingUpdatedAtRangeRule(32, 3600),
    ],
  );
}
