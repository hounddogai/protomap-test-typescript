import { TieredFlightException } from "./tiered-flight-exception.js";

/** A rule a tiered flight exception must pass. Check returns its problems, or none. */
export interface TieredFlightExceptionRule {
  check(item: TieredFlightException): string[];
}

export class TieredFlightExceptionRequiredCodeRule implements TieredFlightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFlightException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFlightExceptionCostRangeRule implements TieredFlightExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFlightException): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredFlightExceptionTitleLengthRule implements TieredFlightExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFlightException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFlightExceptionArchivedGuardRule implements TieredFlightExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredFlightException): string[] {
    if (item.archived && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class TieredFlightExceptionRequiredCategoryRule implements TieredFlightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFlightException): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered flight exception. */
export class TieredFlightExceptionValidator {
  rules: TieredFlightExceptionRule[];

  constructor(rules: TieredFlightExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFlightException): string[] {
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

  requireValid(item: TieredFlightException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFlightException[]): Map<string, string[]> {
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

export function defaultTieredFlightExceptionValidator(): TieredFlightExceptionValidator {
  return new TieredFlightExceptionValidator(
    [
      new TieredFlightExceptionRequiredCodeRule("tiered flight exception needs a value"),
      new TieredFlightExceptionCostRangeRule(7.7, 2923.4),
      new TieredFlightExceptionTitleLengthRule(120),
      new TieredFlightExceptionArchivedGuardRule(64),
      new TieredFlightExceptionRequiredCategoryRule("tiered flight exception needs an entry"),
    ],
  );
}
