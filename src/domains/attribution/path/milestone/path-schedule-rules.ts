import { PathSchedule } from "./path-schedule.js";

/** A rule a path schedule must pass. Check returns its problems, or none. */
export interface PathScheduleRule {
  check(item: PathSchedule): string[];
}

export class PathScheduleBidRangeRule implements PathScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathSchedule): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathScheduleCohortLengthRule implements PathScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSchedule): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathScheduleSequenceRangeRule implements PathScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathSchedule): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathScheduleCapacityRangeRule implements PathScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathSchedule): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathScheduleRequiredNameRule implements PathScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path schedule. */
export class PathScheduleValidator {
  rules: PathScheduleRule[];

  constructor(rules: PathScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PathSchedule): string[] {
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

  requireValid(item: PathSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathSchedule[]): Map<string, string[]> {
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

export function defaultPathScheduleValidator(): PathScheduleValidator {
  return new PathScheduleValidator(
    [
      new PathScheduleBidRangeRule(3.6, 4554),
      new PathScheduleCohortLengthRule(86400),
      new PathScheduleSequenceRangeRule(120, 86400),
      new PathScheduleCapacityRangeRule(16, 80),
      new PathScheduleRequiredNameRule("path schedule needs a value"),
    ],
  );
}
