import { DeflectionCycle } from "./deflection-cycle.js";

/** A rule a deflection cycle must pass. Check returns its problems, or none. */
export interface DeflectionCycleRule {
  check(item: DeflectionCycle): string[];
}

export class DeflectionCycleLocaleLengthRule implements DeflectionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionCycle): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionCycleRetriesRangeRule implements DeflectionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionCycle): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionCycleCodePrefixRule implements DeflectionCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionCycleArchivedGuardRule implements DeflectionCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionCycle): string[] {
    if (item.archived && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class DeflectionCycleRequiredCodeRule implements DeflectionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionCycleCodeLengthRule implements DeflectionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection cycle. */
export class DeflectionCycleValidator {
  rules: DeflectionCycleRule[];

  constructor(rules: DeflectionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionCycle): string[] {
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

  requireValid(item: DeflectionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionCycle[]): Map<string, string[]> {
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

export function defaultDeflectionCycleValidator(): DeflectionCycleValidator {
  return new DeflectionCycleValidator(
    [
      new DeflectionCycleLocaleLengthRule(80),
      new DeflectionCycleRetriesRangeRule(64, 80),
      new DeflectionCycleCodePrefixRule("OPS"),
      new DeflectionCycleArchivedGuardRule(64),
      new DeflectionCycleRequiredCodeRule("deflection cycle needs an entry"),
      new DeflectionCycleCodeLengthRule(16),
    ],
  );
}
