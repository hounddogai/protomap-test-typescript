import * as text from "../../../../kit/text.js";
import { TieredBounceOverride } from "./tiered-bounce-override.js";

/** A rule a tiered bounce override must pass. Check returns its problems, or none. */
export interface TieredBounceOverrideRule {
  check(item: TieredBounceOverride): string[];
}

export class TieredBounceOverrideAllowedSourceRule implements TieredBounceOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredBounceOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is stale`];
    return [];
  }
}

export class TieredBounceOverrideRequiredCodeRule implements TieredBounceOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceOverrideRequiredChannelRule implements TieredBounceOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceOverride): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceOverrideBudgetRangeRule implements TieredBounceOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceOverride): string[] {
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

export class TieredBounceOverrideSourceLengthRule implements TieredBounceOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceOverride): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBounceOverrideNameLengthRule implements TieredBounceOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered bounce override. */
export class TieredBounceOverrideValidator {
  rules: TieredBounceOverrideRule[];

  constructor(rules: TieredBounceOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBounceOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredBounceOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBounceOverride[]): Map<string, string[]> {
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

export function defaultTieredBounceOverrideValidator(): TieredBounceOverrideValidator {
  return new TieredBounceOverrideValidator(
    [
      new TieredBounceOverrideAllowedSourceRule([]),
      new TieredBounceOverrideRequiredCodeRule("tiered bounce override needs an entry"),
      new TieredBounceOverrideRequiredChannelRule("tiered bounce override needs a value"),
      new TieredBounceOverrideBudgetRangeRule(8.7, 452.8),
      new TieredBounceOverrideSourceLengthRule(1000),
      new TieredBounceOverrideNameLengthRule(86400),
    ],
  );
}
