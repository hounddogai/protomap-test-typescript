import * as text from "../../../../kit/text.js";
import { TieredCreativeOverride } from "./tiered-creative-override.js";

/** A rule a tiered creative override must pass. Check returns its problems, or none. */
export interface TieredCreativeOverrideRule {
  check(item: TieredCreativeOverride): string[];
}

export class TieredCreativeOverrideMarginRangeRule implements TieredCreativeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCreativeOverride): string[] {
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

export class TieredCreativeOverrideAllowedChecksumRule implements TieredCreativeOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredCreativeOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is not allowed`];
    return [];
  }
}

export class TieredCreativeOverrideBudgetRangeRule implements TieredCreativeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCreativeOverride): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredCreativeOverrideCodeLengthRule implements TieredCreativeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCreativeOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCreativeOverrideCodePrefixRule implements TieredCreativeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredCreativeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredCreativeOverrideRequiredCodeRule implements TieredCreativeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCreativeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered creative override. */
export class TieredCreativeOverrideValidator {
  rules: TieredCreativeOverrideRule[];

  constructor(rules: TieredCreativeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCreativeOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredCreativeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCreativeOverride[]): Map<string, string[]> {
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

export function defaultTieredCreativeOverrideValidator(): TieredCreativeOverrideValidator {
  return new TieredCreativeOverrideValidator(
    [
      new TieredCreativeOverrideMarginRangeRule(3.8, 3976.1),
      new TieredCreativeOverrideAllowedChecksumRule(["capped", "primary", "global"]),
      new TieredCreativeOverrideBudgetRangeRule(1, 3531.3),
      new TieredCreativeOverrideCodeLengthRule(80),
      new TieredCreativeOverrideCodePrefixRule("ACM"),
      new TieredCreativeOverrideRequiredCodeRule("tiered creative override needs a value"),
    ],
  );
}
