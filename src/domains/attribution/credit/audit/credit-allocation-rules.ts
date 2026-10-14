import { CreditAllocation } from "./credit-allocation.js";

/** A rule a credit allocation must pass. Check returns its problems, or none. */
export interface CreditAllocationRule {
  check(item: CreditAllocation): string[];
}

export class CreditAllocationPriorityRangeRule implements CreditAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditAllocation): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditAllocationOwnerIdLengthRule implements CreditAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAllocation): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAllocationCodePrefixRule implements CreditAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditAllocationRequiredCodeRule implements CreditAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit allocation. */
export class CreditAllocationValidator {
  rules: CreditAllocationRule[];

  constructor(rules: CreditAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CreditAllocation): string[] {
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

  requireValid(item: CreditAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditAllocation[]): Map<string, string[]> {
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

export function defaultCreditAllocationValidator(): CreditAllocationValidator {
  return new CreditAllocationValidator(
    [
      new CreditAllocationPriorityRangeRule(255, 3600),
      new CreditAllocationOwnerIdLengthRule(255),
      new CreditAllocationCodePrefixRule("OPS"),
      new CreditAllocationRequiredCodeRule("credit allocation needs this field"),
    ],
  );
}
