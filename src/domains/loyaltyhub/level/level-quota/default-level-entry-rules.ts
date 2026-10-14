import { DefaultLevelEntry } from "./default-level-entry.js";

/** A rule a default level entry must pass. Check returns its problems, or none. */
export interface DefaultLevelEntryRule {
  check(item: DefaultLevelEntry): string[];
}

export class DefaultLevelEntryCodeLengthRule implements DefaultLevelEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultLevelEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultLevelEntryAttemptsRangeRule implements DefaultLevelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultLevelEntry): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultLevelEntrySendAtRangeRule implements DefaultLevelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultLevelEntry): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultLevelEntryRequiredLabelRule implements DefaultLevelEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultLevelEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default level entry. */
export class DefaultLevelEntryValidator {
  rules: DefaultLevelEntryRule[];

  constructor(rules: DefaultLevelEntryRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultLevelEntry): string[] {
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

  requireValid(item: DefaultLevelEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultLevelEntry[]): Map<string, string[]> {
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

export function defaultDefaultLevelEntryValidator(): DefaultLevelEntryValidator {
  return new DefaultLevelEntryValidator(
    [
      new DefaultLevelEntryCodeLengthRule(32),
      new DefaultLevelEntryAttemptsRangeRule(16, 1000),
      new DefaultLevelEntrySendAtRangeRule(255, 255),
      new DefaultLevelEntryRequiredLabelRule("default level entry needs this field"),
    ],
  );
}
