import { GlobalStreakRecord } from "./global-streak-record.js";

/** A rule a global streak record must pass. Check returns its problems, or none. */
export interface GlobalStreakRecordRule {
  check(item: GlobalStreakRecord): string[];
}

export class GlobalStreakRecordRequiredNameRule implements GlobalStreakRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalStreakRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalStreakRecordCodePrefixRule implements GlobalStreakRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalStreakRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalStreakRecordRequiredUnitRule implements GlobalStreakRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalStreakRecord): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalStreakRecordLocaleLengthRule implements GlobalStreakRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStreakRecord): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global streak record. */
export class GlobalStreakRecordValidator {
  rules: GlobalStreakRecordRule[];

  constructor(rules: GlobalStreakRecordRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalStreakRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalStreakRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalStreakRecord[]): Map<string, string[]> {
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

export function defaultGlobalStreakRecordValidator(): GlobalStreakRecordValidator {
  return new GlobalStreakRecordValidator(
    [
      new GlobalStreakRecordRequiredNameRule("global streak record needs a value"),
      new GlobalStreakRecordCodePrefixRule("REF"),
      new GlobalStreakRecordRequiredUnitRule("global streak record needs an entry"),
      new GlobalStreakRecordLocaleLengthRule(1000),
    ],
  );
}
