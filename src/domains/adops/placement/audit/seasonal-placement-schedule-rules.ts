import { SeasonalPlacementSchedule } from "./seasonal-placement-schedule.js";

/** A rule a seasonal placement schedule must pass. Check returns its problems, or none. */
export interface SeasonalPlacementScheduleRule {
  check(item: SeasonalPlacementSchedule): string[];
}

export class SeasonalPlacementScheduleVisibleGuardRule implements SeasonalPlacementScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalPlacementSchedule): string[] {
    if (item.visible && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SeasonalPlacementScheduleRequiredTitleRule implements SeasonalPlacementScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPlacementSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPlacementScheduleRevisionRangeRule implements SeasonalPlacementScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPlacementSchedule): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalPlacementScheduleCodeLengthRule implements SeasonalPlacementScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPlacementSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPlacementScheduleRequiredPhoneRule implements SeasonalPlacementScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPlacementSchedule): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal placement schedule. */
export class SeasonalPlacementScheduleValidator {
  rules: SeasonalPlacementScheduleRule[];

  constructor(rules: SeasonalPlacementScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPlacementSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalPlacementSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPlacementSchedule[]): Map<string, string[]> {
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

export function defaultSeasonalPlacementScheduleValidator(): SeasonalPlacementScheduleValidator {
  return new SeasonalPlacementScheduleValidator(
    [
      new SeasonalPlacementScheduleVisibleGuardRule(255),
      new SeasonalPlacementScheduleRequiredTitleRule("seasonal placement schedule needs this field"),
      new SeasonalPlacementScheduleRevisionRangeRule(64, 80),
      new SeasonalPlacementScheduleCodeLengthRule(80),
      new SeasonalPlacementScheduleRequiredPhoneRule("seasonal placement schedule needs this field"),
    ],
  );
}
