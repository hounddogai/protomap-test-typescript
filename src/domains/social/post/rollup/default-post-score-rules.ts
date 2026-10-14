import * as text from "../../../../kit/text.js";
import { DefaultPostScore } from "./default-post-score.js";

/** A rule a default post score must pass. Check returns its problems, or none. */
export interface DefaultPostScoreRule {
  check(item: DefaultPostScore): string[];
}

export class DefaultPostScoreMinimumRangeRule implements DefaultPostScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPostScore): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPostScoreCodePrefixRule implements DefaultPostScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPostScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPostScoreAllowedCodeRule implements DefaultPostScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPostScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class DefaultPostScoreRequiredNameRule implements DefaultPostScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPostScoreSendAtRangeRule implements DefaultPostScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPostScore): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPostScoreCodeLengthRule implements DefaultPostScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default post score. */
export class DefaultPostScoreValidator {
  rules: DefaultPostScoreRule[];

  constructor(rules: DefaultPostScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPostScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPostScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPostScore[]): Map<string, string[]> {
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

export function defaultDefaultPostScoreValidator(): DefaultPostScoreValidator {
  return new DefaultPostScoreValidator(
    [
      new DefaultPostScoreMinimumRangeRule(4.7, 3737.7),
      new DefaultPostScoreCodePrefixRule("REF"),
      new DefaultPostScoreAllowedCodeRule(["primary"]),
      new DefaultPostScoreRequiredNameRule("default post score needs this field"),
      new DefaultPostScoreSendAtRangeRule(120, 255),
      new DefaultPostScoreCodeLengthRule(16),
    ],
  );
}
