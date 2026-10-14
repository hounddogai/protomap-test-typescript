import { DeflectionTier } from "./deflection-tier.js";

/** A rule a deflection tier must pass. Check returns its problems, or none. */
export interface DeflectionTierRule {
  check(item: DeflectionTier): string[];
}

export class DeflectionTierCodePrefixRule implements DeflectionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionTierNotesLengthRule implements DeflectionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionTier): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionTierTitleLengthRule implements DeflectionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionTierRequiredTitleRule implements DeflectionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionTierRequiredNotesRule implements DeflectionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionTier): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionTierRateRangeRule implements DeflectionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionTier): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a deflection tier. */
export class DeflectionTierValidator {
  rules: DeflectionTierRule[];

  constructor(rules: DeflectionTierRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionTier[]): Map<string, string[]> {
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

export function defaultDeflectionTierValidator(): DeflectionTierValidator {
  return new DeflectionTierValidator(
    [
      new DeflectionTierCodePrefixRule("OPS"),
      new DeflectionTierNotesLengthRule(64),
      new DeflectionTierTitleLengthRule(3600),
      new DeflectionTierRequiredTitleRule("deflection tier needs a value"),
      new DeflectionTierRequiredNotesRule("deflection tier needs this field"),
      new DeflectionTierRateRangeRule(9.2, 1046.8),
    ],
  );
}
