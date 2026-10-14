import * as text from "../../../../kit/text.js";
import { CappedBounceBudget } from "./capped-bounce-budget.js";

/** A rule a capped bounce budget must pass. Check returns its problems, or none. */
export interface CappedBounceBudgetRule {
  check(item: CappedBounceBudget): string[];
}

export class CappedBounceBudgetAllowedLocaleRule implements CappedBounceBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedBounceBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is above maximum`];
    return [];
  }
}

export class CappedBounceBudgetRequiredCodeRule implements CappedBounceBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBounceBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBounceBudgetNameLengthRule implements CappedBounceBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBounceBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBounceBudgetChannelLengthRule implements CappedBounceBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBounceBudget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBounceBudgetFrequencyCapRangeRule implements CappedBounceBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBounceBudget): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedBounceBudgetCodePrefixRule implements CappedBounceBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedBounceBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a capped bounce budget. */
export class CappedBounceBudgetValidator {
  rules: CappedBounceBudgetRule[];

  constructor(rules: CappedBounceBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBounceBudget): string[] {
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

  requireValid(item: CappedBounceBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBounceBudget[]): Map<string, string[]> {
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

export function defaultCappedBounceBudgetValidator(): CappedBounceBudgetValidator {
  return new CappedBounceBudgetValidator(
    [
      new CappedBounceBudgetAllowedLocaleRule(["fallback", "weighted"]),
      new CappedBounceBudgetRequiredCodeRule("capped bounce budget needs an entry"),
      new CappedBounceBudgetNameLengthRule(32),
      new CappedBounceBudgetChannelLengthRule(1000),
      new CappedBounceBudgetFrequencyCapRangeRule(16, 120),
      new CappedBounceBudgetCodePrefixRule("X"),
    ],
  );
}
