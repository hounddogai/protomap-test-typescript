import { SeasonalWaitSchedule } from "./seasonal-wait-schedule.js";

/** A rule a seasonal wait schedule must pass. Check returns its problems, or none. */
export interface SeasonalWaitScheduleRule {
  check(item: SeasonalWaitSchedule): string[];
}

export class SeasonalWaitScheduleDescriptionLengthRule implements SeasonalWaitScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWaitSchedule): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWaitScheduleCodePrefixRule implements SeasonalWaitScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalWaitSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalWaitScheduleSegmentLengthRule implements SeasonalWaitScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWaitSchedule): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWaitScheduleSequenceRangeRule implements SeasonalWaitScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWaitSchedule): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalWaitScheduleRequiredSegmentRule implements SeasonalWaitScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWaitSchedule): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal wait schedule. */
export class SeasonalWaitScheduleValidator {
  rules: SeasonalWaitScheduleRule[];

  constructor(rules: SeasonalWaitScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWaitSchedule): string[] {
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

  requireValid(item: SeasonalWaitSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWaitSchedule[]): Map<string, string[]> {
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

export function defaultSeasonalWaitScheduleValidator(): SeasonalWaitScheduleValidator {
  return new SeasonalWaitScheduleValidator(
    [
      new SeasonalWaitScheduleDescriptionLengthRule(16),
      new SeasonalWaitScheduleCodePrefixRule("X"),
      new SeasonalWaitScheduleSegmentLengthRule(16),
      new SeasonalWaitScheduleSequenceRangeRule(120, 255),
      new SeasonalWaitScheduleRequiredSegmentRule("seasonal wait schedule needs this field"),
    ],
  );
}
