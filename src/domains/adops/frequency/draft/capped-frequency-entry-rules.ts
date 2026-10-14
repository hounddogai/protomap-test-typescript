import { CappedFrequencyEntry } from "./capped-frequency-entry.js";

/** A rule a capped frequency entry must pass. Check returns its problems, or none. */
export interface CappedFrequencyEntryRule {
  check(item: CappedFrequencyEntry): string[];
}

export class CappedFrequencyEntryCodePrefixRule implements CappedFrequencyEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedFrequencyEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedFrequencyEntryWindowDaysRangeRule implements CappedFrequencyEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencyEntry): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFrequencyEntryAmountRangeRule implements CappedFrequencyEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencyEntry): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFrequencyEntryRequiredCodeRule implements CappedFrequencyEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped frequency entry. */
export class CappedFrequencyEntryValidator {
  rules: CappedFrequencyEntryRule[];

  constructor(rules: CappedFrequencyEntryRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFrequencyEntry): string[] {
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

  requireValid(item: CappedFrequencyEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFrequencyEntry[]): Map<string, string[]> {
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

export function defaultCappedFrequencyEntryValidator(): CappedFrequencyEntryValidator {
  return new CappedFrequencyEntryValidator(
    [
      new CappedFrequencyEntryCodePrefixRule("REF"),
      new CappedFrequencyEntryWindowDaysRangeRule(1000, 86400),
      new CappedFrequencyEntryAmountRangeRule(0.4, 492.3),
      new CappedFrequencyEntryRequiredCodeRule("capped frequency entry needs an entry"),
    ],
  );
}
