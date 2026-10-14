import * as text from "../../../../kit/text.js";
import { GlobalCreditAllocation } from "./global-credit-allocation.js";

/** A rule a global credit allocation must pass. Check returns its problems, or none. */
export interface GlobalCreditAllocationRule {
  check(item: GlobalCreditAllocation): string[];
}

export class GlobalCreditAllocationRequiredCodeRule implements GlobalCreditAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreditAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreditAllocationCodeLengthRule implements GlobalCreditAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreditAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCreditAllocationCodePrefixRule implements GlobalCreditAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalCreditAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalCreditAllocationAllowedLabelRule implements GlobalCreditAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalCreditAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class GlobalCreditAllocationGraceDaysRangeRule implements GlobalCreditAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCreditAllocation): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global credit allocation. */
export class GlobalCreditAllocationValidator {
  rules: GlobalCreditAllocationRule[];

  constructor(rules: GlobalCreditAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreditAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCreditAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreditAllocation[]): Map<string, string[]> {
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

export function defaultGlobalCreditAllocationValidator(): GlobalCreditAllocationValidator {
  return new GlobalCreditAllocationValidator(
    [
      new GlobalCreditAllocationRequiredCodeRule("global credit allocation needs this field"),
      new GlobalCreditAllocationCodeLengthRule(1000),
      new GlobalCreditAllocationCodePrefixRule("Q"),
      new GlobalCreditAllocationAllowedLabelRule([]),
      new GlobalCreditAllocationGraceDaysRangeRule(64, 1000),
    ],
  );
}
