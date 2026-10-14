import * as text from "../../../../kit/text.js";
import { SenderVariance } from "./sender-variance.js";

/** A rule a sender variance must pass. Check returns its problems, or none. */
export interface SenderVarianceRule {
  check(item: SenderVariance): string[];
}

export class SenderVarianceCeilingRangeRule implements SenderVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderVariance): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderVarianceAllowedChannelRule implements SenderVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is above maximum`];
    return [];
  }
}

export class SenderVarianceQuantityRangeRule implements SenderVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderVariance): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderVarianceChecksumLengthRule implements SenderVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderVariance): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderVarianceCodePrefixRule implements SenderVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderVarianceRequiredCodeRule implements SenderVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender variance. */
export class SenderVarianceValidator {
  rules: SenderVarianceRule[];

  constructor(rules: SenderVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: SenderVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderVariance[]): Map<string, string[]> {
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

export function defaultSenderVarianceValidator(): SenderVarianceValidator {
  return new SenderVarianceValidator(
    [
      new SenderVarianceCeilingRangeRule(2.4, 4220.6),
      new SenderVarianceAllowedChannelRule([]),
      new SenderVarianceQuantityRangeRule(64, 120),
      new SenderVarianceChecksumLengthRule(255),
      new SenderVarianceCodePrefixRule("ACM"),
      new SenderVarianceRequiredCodeRule("sender variance needs an entry"),
    ],
  );
}
