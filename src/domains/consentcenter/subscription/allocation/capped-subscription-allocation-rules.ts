import * as text from "../../../../kit/text.js";
import { CappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

/** A rule a capped subscription allocation must pass. Check returns its problems, or none. */
export interface CappedSubscriptionAllocationRule {
  check(item: CappedSubscriptionAllocation): string[];
}

export class CappedSubscriptionAllocationNameLengthRule implements CappedSubscriptionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSubscriptionAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSubscriptionAllocationUpdatedAtRangeRule implements CappedSubscriptionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedSubscriptionAllocation): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedSubscriptionAllocationCodeLengthRule implements CappedSubscriptionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSubscriptionAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSubscriptionAllocationRequiredNameRule implements CappedSubscriptionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSubscriptionAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSubscriptionAllocationRequiredCodeRule implements CappedSubscriptionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSubscriptionAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSubscriptionAllocationAllowedCodeRule implements CappedSubscriptionAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedSubscriptionAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a capped subscription allocation. */
export class CappedSubscriptionAllocationValidator {
  rules: CappedSubscriptionAllocationRule[];

  constructor(rules: CappedSubscriptionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSubscriptionAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedSubscriptionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSubscriptionAllocation[]): Map<string, string[]> {
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

export function defaultCappedSubscriptionAllocationValidator(): CappedSubscriptionAllocationValidator {
  return new CappedSubscriptionAllocationValidator(
    [
      new CappedSubscriptionAllocationNameLengthRule(32),
      new CappedSubscriptionAllocationUpdatedAtRangeRule(64, 255),
      new CappedSubscriptionAllocationCodeLengthRule(1000),
      new CappedSubscriptionAllocationRequiredNameRule("capped subscription allocation needs an entry"),
      new CappedSubscriptionAllocationRequiredCodeRule("capped subscription allocation needs this field"),
      new CappedSubscriptionAllocationAllowedCodeRule(["adaptive"]),
    ],
  );
}
