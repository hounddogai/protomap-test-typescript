import * as text from "../../../../kit/text.js";
import { CreditCycle } from "./credit-cycle.js";

/** A rule a credit cycle must pass. Check returns its problems, or none. */
export interface CreditCycleRule {
  check(item: CreditCycle): string[];
}

export class CreditCycleAllowedChannelRule implements CreditCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is missing`];
    return [];
  }
}

export class CreditCycleCodePrefixRule implements CreditCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditCycleNameLengthRule implements CreditCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditCycleRequiredNameRule implements CreditCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreditCycleRequiredChannelRule implements CreditCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditCycle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CreditCycleChannelLengthRule implements CreditCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditCycle): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit cycle. */
export class CreditCycleValidator {
  rules: CreditCycleRule[];

  constructor(rules: CreditCycleRule[]) {
    this.rules = rules;
  }

  validate(item: CreditCycle): string[] {
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

  requireValid(item: CreditCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditCycle[]): Map<string, string[]> {
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

export function defaultCreditCycleValidator(): CreditCycleValidator {
  return new CreditCycleValidator(
    [
      new CreditCycleAllowedChannelRule(["default", "manual"]),
      new CreditCycleCodePrefixRule("ACM"),
      new CreditCycleNameLengthRule(64),
      new CreditCycleRequiredNameRule("credit cycle needs an entry"),
      new CreditCycleRequiredChannelRule("credit cycle needs this field"),
      new CreditCycleChannelLengthRule(120),
    ],
  );
}
