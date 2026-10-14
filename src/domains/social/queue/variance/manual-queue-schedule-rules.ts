import { ManualQueueSchedule } from "./manual-queue-schedule.js";

/** A rule a manual queue schedule must pass. Check returns its problems, or none. */
export interface ManualQueueScheduleRule {
  check(item: ManualQueueSchedule): string[];
}

export class ManualQueueScheduleMinimumRangeRule implements ManualQueueScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualQueueSchedule): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualQueueScheduleRequiredAudienceIdRule implements ManualQueueScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualQueueSchedule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ManualQueueScheduleBidRangeRule implements ManualQueueScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualQueueSchedule): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualQueueScheduleVersionRangeRule implements ManualQueueScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualQueueSchedule): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualQueueScheduleAudienceIdLengthRule implements ManualQueueScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualQueueSchedule): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual queue schedule. */
export class ManualQueueScheduleValidator {
  rules: ManualQueueScheduleRule[];

  constructor(rules: ManualQueueScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualQueueSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualQueueSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualQueueSchedule[]): Map<string, string[]> {
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

export function defaultManualQueueScheduleValidator(): ManualQueueScheduleValidator {
  return new ManualQueueScheduleValidator(
    [
      new ManualQueueScheduleMinimumRangeRule(4.1, 4603.1),
      new ManualQueueScheduleRequiredAudienceIdRule("manual queue schedule needs this field"),
      new ManualQueueScheduleBidRangeRule(3.6, 4544.8),
      new ManualQueueScheduleVersionRangeRule(64, 255),
      new ManualQueueScheduleAudienceIdLengthRule(64),
    ],
  );
}
