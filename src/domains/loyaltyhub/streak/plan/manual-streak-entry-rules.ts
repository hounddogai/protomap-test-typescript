import { ManualStreakEntry } from "./manual-streak-entry.js";

/** A rule a manual streak entry must pass. Check returns its problems, or none. */
export interface ManualStreakEntryRule {
  check(item: ManualStreakEntry): string[];
}

export class ManualStreakEntryLabelLengthRule implements ManualStreakEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualStreakEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualStreakEntryCodePrefixRule implements ManualStreakEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualStreakEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualStreakEntryRequiredTitleRule implements ManualStreakEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualStreakEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualStreakEntryUpdatedAtRangeRule implements ManualStreakEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualStreakEntry): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual streak entry. */
export class ManualStreakEntryValidator {
  rules: ManualStreakEntryRule[];

  constructor(rules: ManualStreakEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ManualStreakEntry): string[] {
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

  requireValid(item: ManualStreakEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualStreakEntry[]): Map<string, string[]> {
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

export function defaultManualStreakEntryValidator(): ManualStreakEntryValidator {
  return new ManualStreakEntryValidator(
    [
      new ManualStreakEntryLabelLengthRule(1000),
      new ManualStreakEntryCodePrefixRule("ACM"),
      new ManualStreakEntryRequiredTitleRule("manual streak entry needs an entry"),
      new ManualStreakEntryUpdatedAtRangeRule(64, 80),
    ],
  );
}
