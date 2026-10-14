import { ScheduledWarmupRecord } from "./scheduled-warmup-record.js";

/** A rule a scheduled warmup record must pass. Check returns its problems, or none. */
export interface ScheduledWarmupRecordRule {
  check(item: ScheduledWarmupRecord): string[];
}

export class ScheduledWarmupRecordCapacityRangeRule implements ScheduledWarmupRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWarmupRecord): string[] {
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

export class ScheduledWarmupRecordRequiredJourneyIdRule implements ScheduledWarmupRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWarmupRecord): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWarmupRecordCodePrefixRule implements ScheduledWarmupRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledWarmupRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled warmup record. */
export class ScheduledWarmupRecordValidator {
  rules: ScheduledWarmupRecordRule[];

  constructor(rules: ScheduledWarmupRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWarmupRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWarmupRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWarmupRecord[]): Map<string, string[]> {
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

export function defaultScheduledWarmupRecordValidator(): ScheduledWarmupRecordValidator {
  return new ScheduledWarmupRecordValidator(
    [
      new ScheduledWarmupRecordCapacityRangeRule(86400, 86400),
      new ScheduledWarmupRecordRequiredJourneyIdRule("scheduled warmup record needs this field"),
      new ScheduledWarmupRecordCodePrefixRule("OPS"),
    ],
  );
}
