import * as text from "../../../../kit/text.js";
import { BounceVariance } from "./bounce-variance.js";

/** A rule a bounce variance must pass. Check returns its problems, or none. */
export interface BounceVarianceRule {
  check(item: BounceVariance): string[];
}

export class BounceVarianceAllowedCodeRule implements BounceVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class BounceVarianceRequiredCodeRule implements BounceVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceVarianceRequiredNameRule implements BounceVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BounceVarianceCodePrefixRule implements BounceVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BounceVarianceEndsAtRangeRule implements BounceVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceVariance): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceVarianceCodeLengthRule implements BounceVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce variance. */
export class BounceVarianceValidator {
  rules: BounceVarianceRule[];

  constructor(rules: BounceVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: BounceVariance): string[] {
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

  requireValid(item: BounceVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceVariance[]): Map<string, string[]> {
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

export function defaultBounceVarianceValidator(): BounceVarianceValidator {
  return new BounceVarianceValidator(
    [
      new BounceVarianceAllowedCodeRule(["fallback", "batched"]),
      new BounceVarianceRequiredCodeRule("bounce variance needs an entry"),
      new BounceVarianceRequiredNameRule("bounce variance needs an entry"),
      new BounceVarianceCodePrefixRule("Q"),
      new BounceVarianceEndsAtRangeRule(255, 3600),
      new BounceVarianceCodeLengthRule(255),
    ],
  );
}
