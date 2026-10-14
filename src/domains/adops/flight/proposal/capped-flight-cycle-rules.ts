import { CappedFlightCycle } from "./capped-flight-cycle.js";

/** A rule a capped flight cycle must pass. Check returns its problems, or none. */
export interface CappedFlightCycleRule {
  check(item: CappedFlightCycle): string[];
}

export class CappedFlightCycleActiveGuardRule implements CappedFlightCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedFlightCycle): string[] {
    if (item.active && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while active`];
    return [];
  }
}

export class CappedFlightCycleMarginRangeRule implements CappedFlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFlightCycle): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFlightCycleRequiredCategoryRule implements CappedFlightCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFlightCycle): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFlightCycleDurationMinutesRangeRule implements CappedFlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFlightCycle): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped flight cycle. */
export class CappedFlightCycleValidator {
  rules: CappedFlightCycleRule[];

  constructor(rules: CappedFlightCycleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFlightCycle): string[] {
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

  requireValid(item: CappedFlightCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFlightCycle[]): Map<string, string[]> {
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

export function defaultCappedFlightCycleValidator(): CappedFlightCycleValidator {
  return new CappedFlightCycleValidator(
    [
      new CappedFlightCycleActiveGuardRule(9.7),
      new CappedFlightCycleMarginRangeRule(2.7, 4281),
      new CappedFlightCycleRequiredCategoryRule("capped flight cycle needs an entry"),
      new CappedFlightCycleDurationMinutesRangeRule(16, 86400),
    ],
  );
}
