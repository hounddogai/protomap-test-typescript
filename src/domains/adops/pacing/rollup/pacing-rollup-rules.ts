import * as text from "../../../../kit/text.js";
import { PacingRollup } from "./pacing-rollup.js";

/** A rule a pacing rollup must pass. Check returns its problems, or none. */
export interface PacingRollupRule {
  check(item: PacingRollup): string[];
}

export class PacingRollupCodeLengthRule implements PacingRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingRollupCodePrefixRule implements PacingRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingRollupCeilingRangeRule implements PacingRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingRollup): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingRollupRequiredCodeRule implements PacingRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingRollupAllowedTitleRule implements PacingRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class PacingRollupRequiredTitleRule implements PacingRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing rollup. */
export class PacingRollupValidator {
  rules: PacingRollupRule[];

  constructor(rules: PacingRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PacingRollup): string[] {
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

  requireValid(item: PacingRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingRollup[]): Map<string, string[]> {
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

export function defaultPacingRollupValidator(): PacingRollupValidator {
  return new PacingRollupValidator(
    [
      new PacingRollupCodeLengthRule(80),
      new PacingRollupCodePrefixRule("Q"),
      new PacingRollupCeilingRangeRule(3.8, 1560.1),
      new PacingRollupRequiredCodeRule("pacing rollup needs a value"),
      new PacingRollupAllowedTitleRule([]),
      new PacingRollupRequiredTitleRule("pacing rollup needs an entry"),
    ],
  );
}
