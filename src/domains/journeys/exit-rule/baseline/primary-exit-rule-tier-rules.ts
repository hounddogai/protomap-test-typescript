import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

/** A rule a primary exit rule tier must pass. Check returns its problems, or none. */
export interface PrimaryExitRuleTierRule {
  check(item: PrimaryExitRuleTier): string[];
}

export class PrimaryExitRuleTierCodeLengthRule implements PrimaryExitRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryExitRuleTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryExitRuleTierAllowedDescriptionRule implements PrimaryExitRuleTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryExitRuleTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is above maximum`];
    return [];
  }
}

export class PrimaryExitRuleTierCodePrefixRule implements PrimaryExitRuleTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryExitRuleTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryExitRuleTierRequiredCodeRule implements PrimaryExitRuleTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryExitRuleTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryExitRuleTierMarginRangeRule implements PrimaryExitRuleTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryExitRuleTier): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary exit rule tier. */
export class PrimaryExitRuleTierValidator {
  rules: PrimaryExitRuleTierRule[];

  constructor(rules: PrimaryExitRuleTierRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryExitRuleTier): string[] {
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

  requireValid(item: PrimaryExitRuleTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryExitRuleTier[]): Map<string, string[]> {
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

export function defaultPrimaryExitRuleTierValidator(): PrimaryExitRuleTierValidator {
  return new PrimaryExitRuleTierValidator(
    [
      new PrimaryExitRuleTierCodeLengthRule(120),
      new PrimaryExitRuleTierAllowedDescriptionRule(["tiered"]),
      new PrimaryExitRuleTierCodePrefixRule("OPS"),
      new PrimaryExitRuleTierRequiredCodeRule("primary exit rule tier needs a value"),
      new PrimaryExitRuleTierMarginRangeRule(2.6, 3391.5),
    ],
  );
}
