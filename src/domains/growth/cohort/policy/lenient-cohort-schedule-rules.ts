import { LenientCohortSchedule } from "./lenient-cohort-schedule.js";

/** A rule a lenient cohort schedule must pass. Check returns its problems, or none. */
export interface LenientCohortScheduleRule {
  check(item: LenientCohortSchedule): string[];
}

export class LenientCohortScheduleChannelLengthRule implements LenientCohortScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCohortSchedule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCohortScheduleCodePrefixRule implements LenientCohortScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientCohortSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientCohortScheduleFrequencyCapRangeRule implements LenientCohortScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCohortSchedule): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientCohortScheduleImpressionsRangeRule implements LenientCohortScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCohortSchedule): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientCohortScheduleRequiredCodeRule implements LenientCohortScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCohortSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient cohort schedule. */
export class LenientCohortScheduleValidator {
  rules: LenientCohortScheduleRule[];

  constructor(rules: LenientCohortScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCohortSchedule): string[] {
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

  requireValid(item: LenientCohortSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCohortSchedule[]): Map<string, string[]> {
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

export function defaultLenientCohortScheduleValidator(): LenientCohortScheduleValidator {
  return new LenientCohortScheduleValidator(
    [
      new LenientCohortScheduleChannelLengthRule(3600),
      new LenientCohortScheduleCodePrefixRule("ACM"),
      new LenientCohortScheduleFrequencyCapRangeRule(255, 3600),
      new LenientCohortScheduleImpressionsRangeRule(255, 255),
      new LenientCohortScheduleRequiredCodeRule("lenient cohort schedule needs this field"),
    ],
  );
}
