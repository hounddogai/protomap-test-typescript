import * as text from "../../../../kit/text.js";
import { LevelEntry } from "./level-entry.js";

/** A rule a level entry must pass. Check returns its problems, or none. */
export interface LevelEntryRule {
  check(item: LevelEntry): string[];
}

export class LevelEntryOpenRateRangeRule implements LevelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelEntry): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelEntryRateRangeRule implements LevelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelEntry): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelEntryAllowedCodeRule implements LevelEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class LevelEntryLabelLengthRule implements LevelEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelEntryRequiredTitleRule implements LevelEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LevelEntryRequiredUnitRule implements LevelEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelEntry): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level entry. */
export class LevelEntryValidator {
  rules: LevelEntryRule[];

  constructor(rules: LevelEntryRule[]) {
    this.rules = rules;
  }

  validate(item: LevelEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelEntry[]): Map<string, string[]> {
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

export function defaultLevelEntryValidator(): LevelEntryValidator {
  return new LevelEntryValidator(
    [
      new LevelEntryOpenRateRangeRule(1.4, 4536.2),
      new LevelEntryRateRangeRule(9.3, 259.2),
      new LevelEntryAllowedCodeRule(["tiered", "pending"]),
      new LevelEntryLabelLengthRule(120),
      new LevelEntryRequiredTitleRule("level entry needs a value"),
      new LevelEntryRequiredUnitRule("level entry needs an entry"),
    ],
  );
}
