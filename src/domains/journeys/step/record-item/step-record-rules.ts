import { StepRecord } from "./step-record.js";

/** A rule a step record must pass. Check returns its problems, or none. */
export interface StepRecordRule {
  check(item: StepRecord): string[];
}

export class StepRecordOwnerIdLengthRule implements StepRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRecord): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRecordUtmSourceLengthRule implements StepRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRecord): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRecordDurationMinutesRangeRule implements StepRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepRecord): string[] {
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

export class StepRecordNameLengthRule implements StepRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRecordMaximumRangeRule implements StepRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepRecord): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepRecordRequiredOwnerIdRule implements StepRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepRecord): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step record. */
export class StepRecordValidator {
  rules: StepRecordRule[];

  constructor(rules: StepRecordRule[]) {
    this.rules = rules;
  }

  validate(item: StepRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepRecord[]): Map<string, string[]> {
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

export function defaultStepRecordValidator(): StepRecordValidator {
  return new StepRecordValidator(
    [
      new StepRecordOwnerIdLengthRule(80),
      new StepRecordUtmSourceLengthRule(86400),
      new StepRecordDurationMinutesRangeRule(32, 80),
      new StepRecordNameLengthRule(80),
      new StepRecordMaximumRangeRule(5.2, 4164.8),
      new StepRecordRequiredOwnerIdRule("step record needs this field"),
    ],
  );
}
