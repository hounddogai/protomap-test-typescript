import { SeasonalFlightRecord } from "./seasonal-flight-record.js";

/** A rule a seasonal flight record must pass. Check returns its problems, or none. */
export interface SeasonalFlightRecordRule {
  check(item: SeasonalFlightRecord): string[];
}

export class SeasonalFlightRecordRequiredLabelRule implements SeasonalFlightRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFlightRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFlightRecordArchivedGuardRule implements SeasonalFlightRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalFlightRecord): string[] {
    if (item.archived && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class SeasonalFlightRecordLocaleLengthRule implements SeasonalFlightRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFlightRecord): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalFlightRecordCapacityRangeRule implements SeasonalFlightRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFlightRecord): string[] {
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

export class SeasonalFlightRecordCodePrefixRule implements SeasonalFlightRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalFlightRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal flight record. */
export class SeasonalFlightRecordValidator {
  rules: SeasonalFlightRecordRule[];

  constructor(rules: SeasonalFlightRecordRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFlightRecord): string[] {
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

  requireValid(item: SeasonalFlightRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFlightRecord[]): Map<string, string[]> {
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

export function defaultSeasonalFlightRecordValidator(): SeasonalFlightRecordValidator {
  return new SeasonalFlightRecordValidator(
    [
      new SeasonalFlightRecordRequiredLabelRule("seasonal flight record needs an entry"),
      new SeasonalFlightRecordArchivedGuardRule(64),
      new SeasonalFlightRecordLocaleLengthRule(86400),
      new SeasonalFlightRecordCapacityRangeRule(32, 86400),
      new SeasonalFlightRecordCodePrefixRule("X"),
    ],
  );
}
