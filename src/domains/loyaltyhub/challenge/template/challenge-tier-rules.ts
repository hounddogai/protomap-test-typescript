import * as text from "../../../../kit/text.js";
import { ChallengeTier } from "./challenge-tier.js";

/** A rule a challenge tier must pass. Check returns its problems, or none. */
export interface ChallengeTierRule {
  check(item: ChallengeTier): string[];
}

export class ChallengeTierPhoneLengthRule implements ChallengeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeTier): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeTierAmountRangeRule implements ChallengeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeTier): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeTierCodePrefixRule implements ChallengeTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeTierAllowedNameRule implements ChallengeTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a challenge tier. */
export class ChallengeTierValidator {
  rules: ChallengeTierRule[];

  constructor(rules: ChallengeTierRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeTier[]): Map<string, string[]> {
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

export function defaultChallengeTierValidator(): ChallengeTierValidator {
  return new ChallengeTierValidator(
    [
      new ChallengeTierPhoneLengthRule(32),
      new ChallengeTierAmountRangeRule(4, 1254.6),
      new ChallengeTierCodePrefixRule("ACM"),
      new ChallengeTierAllowedNameRule(["legacy"]),
    ],
  );
}
