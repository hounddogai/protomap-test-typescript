import * as text from "../../../../kit/text.js";
import { DefaultFrequencyScore } from "./default-frequency-score.js";

/** A rule a default frequency score must pass. Check returns its problems, or none. */
export interface DefaultFrequencyScoreRule {
  check(item: DefaultFrequencyScore): string[];
}

export class DefaultFrequencyScoreAllowedDescriptionRule implements DefaultFrequencyScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultFrequencyScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is not allowed`];
    return [];
  }
}

export class DefaultFrequencyScoreCodePrefixRule implements DefaultFrequencyScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFrequencyScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultFrequencyScoreCodeLengthRule implements DefaultFrequencyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFrequencyScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFrequencyScoreRequiredNameRule implements DefaultFrequencyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFrequencyScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFrequencyScoreAmountRangeRule implements DefaultFrequencyScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFrequencyScore): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultFrequencyScoreDescriptionLengthRule implements DefaultFrequencyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFrequencyScore): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default frequency score. */
export class DefaultFrequencyScoreValidator {
  rules: DefaultFrequencyScoreRule[];

  constructor(rules: DefaultFrequencyScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFrequencyScore): string[] {
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

  requireValid(item: DefaultFrequencyScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFrequencyScore[]): Map<string, string[]> {
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

export function defaultDefaultFrequencyScoreValidator(): DefaultFrequencyScoreValidator {
  return new DefaultFrequencyScoreValidator(
    [
      new DefaultFrequencyScoreAllowedDescriptionRule(["pending"]),
      new DefaultFrequencyScoreCodePrefixRule("X"),
      new DefaultFrequencyScoreCodeLengthRule(64),
      new DefaultFrequencyScoreRequiredNameRule("default frequency score needs a value"),
      new DefaultFrequencyScoreAmountRangeRule(0.8, 4714.4),
      new DefaultFrequencyScoreDescriptionLengthRule(16),
    ],
  );
}
