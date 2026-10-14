import { CappedPacingSchedule } from "./capped-pacing-schedule.js";

/** A rule a capped pacing schedule must pass. Check returns its problems, or none. */
export interface CappedPacingScheduleRule {
  check(item: CappedPacingSchedule): string[];
}

export class CappedPacingScheduleCodePrefixRule implements CappedPacingScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPacingSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPacingScheduleRequiredCodeRule implements CappedPacingScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPacingSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPacingScheduleMaximumRangeRule implements CappedPacingScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPacingSchedule): string[] {
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

export class CappedPacingScheduleLabelLengthRule implements CappedPacingScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPacingSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPacingScheduleClicksRangeRule implements CappedPacingScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPacingSchedule): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedPacingScheduleScoreRangeRule implements CappedPacingScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPacingSchedule): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped pacing schedule. */
export class CappedPacingScheduleValidator {
  rules: CappedPacingScheduleRule[];

  constructor(rules: CappedPacingScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPacingSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedPacingSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPacingSchedule[]): Map<string, string[]> {
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

export function defaultCappedPacingScheduleValidator(): CappedPacingScheduleValidator {
  return new CappedPacingScheduleValidator(
    [
      new CappedPacingScheduleCodePrefixRule("ACM"),
      new CappedPacingScheduleRequiredCodeRule("capped pacing schedule needs this field"),
      new CappedPacingScheduleMaximumRangeRule(1.9, 4514.4),
      new CappedPacingScheduleLabelLengthRule(16),
      new CappedPacingScheduleClicksRangeRule(16, 1000),
      new CappedPacingScheduleScoreRangeRule(0.8, 128.7),
    ],
  );
}
