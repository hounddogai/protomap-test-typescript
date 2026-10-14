import { TieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

/** A rule a tiered exit rule entry must pass. Check returns its problems, or none. */
export interface TieredExitRuleEntryRule {
  check(item: TieredExitRuleEntry): string[];
}

export class TieredExitRuleEntryCodePrefixRule implements TieredExitRuleEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredExitRuleEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredExitRuleEntryUnitLengthRule implements TieredExitRuleEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredExitRuleEntry): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredExitRuleEntryCodeLengthRule implements TieredExitRuleEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredExitRuleEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredExitRuleEntryRateRangeRule implements TieredExitRuleEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredExitRuleEntry): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredExitRuleEntryLimitRangeRule implements TieredExitRuleEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredExitRuleEntry): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredExitRuleEntryRequiredTitleRule implements TieredExitRuleEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredExitRuleEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered exit rule entry. */
export class TieredExitRuleEntryValidator {
  rules: TieredExitRuleEntryRule[];

  constructor(rules: TieredExitRuleEntryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredExitRuleEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredExitRuleEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredExitRuleEntry[]): Map<string, string[]> {
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

export function defaultTieredExitRuleEntryValidator(): TieredExitRuleEntryValidator {
  return new TieredExitRuleEntryValidator(
    [
      new TieredExitRuleEntryCodePrefixRule("X"),
      new TieredExitRuleEntryUnitLengthRule(16),
      new TieredExitRuleEntryCodeLengthRule(255),
      new TieredExitRuleEntryRateRangeRule(2.9, 3938.6),
      new TieredExitRuleEntryLimitRangeRule(80, 86400),
      new TieredExitRuleEntryRequiredTitleRule("tiered exit rule entry needs a value"),
    ],
  );
}
