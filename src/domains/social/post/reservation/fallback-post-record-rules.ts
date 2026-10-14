import { FallbackPostRecord } from "./fallback-post-record.js";

/** A rule a fallback post record must pass. Check returns its problems, or none. */
export interface FallbackPostRecordRule {
  check(item: FallbackPostRecord): string[];
}

export class FallbackPostRecordJourneyIdLengthRule implements FallbackPostRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPostRecord): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPostRecordRequiredCodeRule implements FallbackPostRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPostRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPostRecordCodePrefixRule implements FallbackPostRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPostRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPostRecordRequiredJourneyIdRule implements FallbackPostRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPostRecord): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPostRecordLimitRangeRule implements FallbackPostRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPostRecord): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPostRecordLabelLengthRule implements FallbackPostRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPostRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback post record. */
export class FallbackPostRecordValidator {
  rules: FallbackPostRecordRule[];

  constructor(rules: FallbackPostRecordRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPostRecord): string[] {
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

  requireValid(item: FallbackPostRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPostRecord[]): Map<string, string[]> {
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

export function defaultFallbackPostRecordValidator(): FallbackPostRecordValidator {
  return new FallbackPostRecordValidator(
    [
      new FallbackPostRecordJourneyIdLengthRule(32),
      new FallbackPostRecordRequiredCodeRule("fallback post record needs this field"),
      new FallbackPostRecordCodePrefixRule("REF"),
      new FallbackPostRecordRequiredJourneyIdRule("fallback post record needs an entry"),
      new FallbackPostRecordLimitRangeRule(64, 80),
      new FallbackPostRecordLabelLengthRule(80),
    ],
  );
}
