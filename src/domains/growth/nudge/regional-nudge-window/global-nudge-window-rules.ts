import { GlobalNudgeWindow } from "./global-nudge-window.js";

/** A rule a global nudge window must pass. Check returns its problems, or none. */
export interface GlobalNudgeWindowRule {
  check(item: GlobalNudgeWindow): string[];
}

export class GlobalNudgeWindowActiveGuardRule implements GlobalNudgeWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalNudgeWindow): string[] {
    if (item.active && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while active`];
    return [];
  }
}

export class GlobalNudgeWindowGraceDaysRangeRule implements GlobalNudgeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalNudgeWindow): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalNudgeWindowBidRangeRule implements GlobalNudgeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalNudgeWindow): string[] {
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

/** Runs every rule of a global nudge window. */
export class GlobalNudgeWindowValidator {
  rules: GlobalNudgeWindowRule[];

  constructor(rules: GlobalNudgeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalNudgeWindow): string[] {
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

  requireValid(item: GlobalNudgeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalNudgeWindow[]): Map<string, string[]> {
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

export function defaultGlobalNudgeWindowValidator(): GlobalNudgeWindowValidator {
  return new GlobalNudgeWindowValidator(
    [
      new GlobalNudgeWindowActiveGuardRule(8.8),
      new GlobalNudgeWindowGraceDaysRangeRule(255, 1000),
      new GlobalNudgeWindowBidRangeRule(3.4, 4127.2),
    ],
  );
}
