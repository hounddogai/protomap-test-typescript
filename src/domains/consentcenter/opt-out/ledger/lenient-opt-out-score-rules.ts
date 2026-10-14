import * as text from "../../../../kit/text.js";
import { LenientOptOutScore } from "./lenient-opt-out-score.js";

/** A rule a lenient opt out score must pass. Check returns its problems, or none. */
export interface LenientOptOutScoreRule {
  check(item: LenientOptOutScore): string[];
}

export class LenientOptOutScoreCodePrefixRule implements LenientOptOutScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientOptOutScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientOptOutScoreAllowedLocaleRule implements LenientOptOutScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientOptOutScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is above maximum`];
    return [];
  }
}

export class LenientOptOutScoreLabelLengthRule implements LenientOptOutScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientOptOutScoreCodeLengthRule implements LenientOptOutScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientOptOutScoreLimitRangeRule implements LenientOptOutScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientOptOutScore): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a lenient opt out score. */
export class LenientOptOutScoreValidator {
  rules: LenientOptOutScoreRule[];

  constructor(rules: LenientOptOutScoreRule[]) {
    this.rules = rules;
  }

  validate(item: LenientOptOutScore): string[] {
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

  requireValid(item: LenientOptOutScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientOptOutScore[]): Map<string, string[]> {
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

export function defaultLenientOptOutScoreValidator(): LenientOptOutScoreValidator {
  return new LenientOptOutScoreValidator(
    [
      new LenientOptOutScoreCodePrefixRule("REF"),
      new LenientOptOutScoreAllowedLocaleRule(["batched", "tiered"]),
      new LenientOptOutScoreLabelLengthRule(80),
      new LenientOptOutScoreCodeLengthRule(32),
      new LenientOptOutScoreLimitRangeRule(255, 1000),
    ],
  );
}
