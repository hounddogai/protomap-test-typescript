import { ScheduledLevelProfile } from "./scheduled-level-profile.js";

/** A rule a scheduled level profile must pass. Check returns its problems, or none. */
export interface ScheduledLevelProfileRule {
  check(item: ScheduledLevelProfile): string[];
}

export class ScheduledLevelProfileBatchSizeRangeRule implements ScheduledLevelProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledLevelProfile): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledLevelProfileLabelLengthRule implements ScheduledLevelProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledLevelProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledLevelProfileRequiredCohortRule implements ScheduledLevelProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledLevelProfile): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledLevelProfileRequiredRegionRule implements ScheduledLevelProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledLevelProfile): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledLevelProfileRegionLengthRule implements ScheduledLevelProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledLevelProfile): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled level profile. */
export class ScheduledLevelProfileValidator {
  rules: ScheduledLevelProfileRule[];

  constructor(rules: ScheduledLevelProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledLevelProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledLevelProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledLevelProfile[]): Map<string, string[]> {
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

export function defaultScheduledLevelProfileValidator(): ScheduledLevelProfileValidator {
  return new ScheduledLevelProfileValidator(
    [
      new ScheduledLevelProfileBatchSizeRangeRule(16, 120),
      new ScheduledLevelProfileLabelLengthRule(64),
      new ScheduledLevelProfileRequiredCohortRule("scheduled level profile needs an entry"),
      new ScheduledLevelProfileRequiredRegionRule("scheduled level profile needs an entry"),
      new ScheduledLevelProfileRegionLengthRule(86400),
    ],
  );
}
