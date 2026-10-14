import { BounceException } from "./bounce-exception.js";

/** A rule a bounce exception must pass. Check returns its problems, or none. */
export interface BounceExceptionRule {
  check(item: BounceException): string[];
}

export class BounceExceptionRequiredCodeRule implements BounceExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceExceptionCostRangeRule implements BounceExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceException): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BounceExceptionLabelLengthRule implements BounceExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceExceptionCodePrefixRule implements BounceExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a bounce exception. */
export class BounceExceptionValidator {
  rules: BounceExceptionRule[];

  constructor(rules: BounceExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BounceException): string[] {
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

  requireValid(item: BounceException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceException[]): Map<string, string[]> {
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

export function defaultBounceExceptionValidator(): BounceExceptionValidator {
  return new BounceExceptionValidator(
    [
      new BounceExceptionRequiredCodeRule("bounce exception needs an entry"),
      new BounceExceptionCostRangeRule(0.3, 4038.2),
      new BounceExceptionLabelLengthRule(120),
      new BounceExceptionCodePrefixRule("REF"),
    ],
  );
}
