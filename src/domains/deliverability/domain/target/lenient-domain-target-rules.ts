import * as text from "../../../../kit/text.js";
import { LenientDomainTarget } from "./lenient-domain-target.js";

/** A rule a lenient domain target must pass. Check returns its problems, or none. */
export interface LenientDomainTargetRule {
  check(item: LenientDomainTarget): string[];
}

export class LenientDomainTargetRequiredNameRule implements LenientDomainTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDomainTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDomainTargetAllowedNameRule implements LenientDomainTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientDomainTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class LenientDomainTargetRequiredCurrencyRule implements LenientDomainTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDomainTarget): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDomainTargetAmountRangeRule implements LenientDomainTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientDomainTarget): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientDomainTargetCurrencyLengthRule implements LenientDomainTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDomainTarget): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientDomainTargetRequiredCodeRule implements LenientDomainTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDomainTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient domain target. */
export class LenientDomainTargetValidator {
  rules: LenientDomainTargetRule[];

  constructor(rules: LenientDomainTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDomainTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientDomainTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDomainTarget[]): Map<string, string[]> {
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

export function defaultLenientDomainTargetValidator(): LenientDomainTargetValidator {
  return new LenientDomainTargetValidator(
    [
      new LenientDomainTargetRequiredNameRule("lenient domain target needs this field"),
      new LenientDomainTargetAllowedNameRule(["primary", "seasonal"]),
      new LenientDomainTargetRequiredCurrencyRule("lenient domain target needs an entry"),
      new LenientDomainTargetAmountRangeRule(2.2, 803.3),
      new LenientDomainTargetCurrencyLengthRule(3600),
      new LenientDomainTargetRequiredCodeRule("lenient domain target needs this field"),
    ],
  );
}
