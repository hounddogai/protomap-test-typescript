import { MacroSchedule } from "./macro-schedule.js";

/** A rule a macro schedule must pass. Check returns its problems, or none. */
export interface MacroScheduleRule {
  check(item: MacroSchedule): string[];
}

export class MacroScheduleRequiredReviewerRule implements MacroScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSchedule): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class MacroScheduleVisibleGuardRule implements MacroScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MacroSchedule): string[] {
    if (item.visible && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class MacroScheduleRequiredCountryRule implements MacroScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSchedule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class MacroScheduleRetriesRangeRule implements MacroScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroSchedule): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroScheduleRequiredCodeRule implements MacroScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroScheduleBidRangeRule implements MacroScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroSchedule): string[] {
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

/** Runs every rule of a macro schedule. */
export class MacroScheduleValidator {
  rules: MacroScheduleRule[];

  constructor(rules: MacroScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: MacroSchedule): string[] {
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

  requireValid(item: MacroSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroSchedule[]): Map<string, string[]> {
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

export function defaultMacroScheduleValidator(): MacroScheduleValidator {
  return new MacroScheduleValidator(
    [
      new MacroScheduleRequiredReviewerRule("macro schedule needs an entry"),
      new MacroScheduleVisibleGuardRule(1.7),
      new MacroScheduleRequiredCountryRule("macro schedule needs this field"),
      new MacroScheduleRetriesRangeRule(16, 32),
      new MacroScheduleRequiredCodeRule("macro schedule needs a value"),
      new MacroScheduleBidRangeRule(9.7, 3233.4),
    ],
  );
}
