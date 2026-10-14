import { WeightedStepSchedule } from "./weighted-step-schedule.js";

/** A rule a weighted step schedule must pass. Check returns its problems, or none. */
export interface WeightedStepScheduleRule {
  check(item: WeightedStepSchedule): string[];
}

export class WeightedStepScheduleRevisionRangeRule implements WeightedStepScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedStepSchedule): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedStepScheduleCeilingRangeRule implements WeightedStepScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedStepSchedule): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedStepScheduleRequiredTitleRule implements WeightedStepScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedStepSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedStepScheduleRequiredSourceRule implements WeightedStepScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedStepSchedule): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted step schedule. */
export class WeightedStepScheduleValidator {
  rules: WeightedStepScheduleRule[];

  constructor(rules: WeightedStepScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedStepSchedule): string[] {
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

  requireValid(item: WeightedStepSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedStepSchedule[]): Map<string, string[]> {
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

export function defaultWeightedStepScheduleValidator(): WeightedStepScheduleValidator {
  return new WeightedStepScheduleValidator(
    [
      new WeightedStepScheduleRevisionRangeRule(16, 64),
      new WeightedStepScheduleCeilingRangeRule(5.9, 987.7),
      new WeightedStepScheduleRequiredTitleRule("weighted step schedule needs this field"),
      new WeightedStepScheduleRequiredSourceRule("weighted step schedule needs this field"),
    ],
  );
}
