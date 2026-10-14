import * as text from "../../../../kit/text.js";
import { CreditTarget } from "./credit-target.js";

/** A rule a credit target must pass. Check returns its problems, or none. */
export interface CreditTargetRule {
  check(item: CreditTarget): string[];
}

export class CreditTargetCodeLengthRule implements CreditTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditTargetCodePrefixRule implements CreditTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditTargetBudgetRangeRule implements CreditTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditTarget): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditTargetPinnedGuardRule implements CreditTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreditTarget): string[] {
    if (item.pinned && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class CreditTargetRequiredNameRule implements CreditTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreditTargetAllowedChannelRule implements CreditTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is blocked`];
    return [];
  }
}

/** Runs every rule of a credit target. */
export class CreditTargetValidator {
  rules: CreditTargetRule[];

  constructor(rules: CreditTargetRule[]) {
    this.rules = rules;
  }

  validate(item: CreditTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditTarget[]): Map<string, string[]> {
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

export function defaultCreditTargetValidator(): CreditTargetValidator {
  return new CreditTargetValidator(
    [
      new CreditTargetCodeLengthRule(64),
      new CreditTargetCodePrefixRule("OPS"),
      new CreditTargetBudgetRangeRule(8.1, 1082.3),
      new CreditTargetPinnedGuardRule(5.6),
      new CreditTargetRequiredNameRule("credit target needs an entry"),
      new CreditTargetAllowedChannelRule(["regional"]),
    ],
  );
}
