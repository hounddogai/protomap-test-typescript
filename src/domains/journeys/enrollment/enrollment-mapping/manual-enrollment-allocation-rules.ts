import { ManualEnrollmentAllocation } from "./manual-enrollment-allocation.js";

/** A rule a manual enrollment allocation must pass. Check returns its problems, or none. */
export interface ManualEnrollmentAllocationRule {
  check(item: ManualEnrollmentAllocation): string[];
}

export class ManualEnrollmentAllocationCodePrefixRule implements ManualEnrollmentAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualEnrollmentAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualEnrollmentAllocationLocaleLengthRule implements ManualEnrollmentAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEnrollmentAllocation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualEnrollmentAllocationCodeLengthRule implements ManualEnrollmentAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEnrollmentAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualEnrollmentAllocationRequiredNameRule implements ManualEnrollmentAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEnrollmentAllocationRequiredSourceRule implements ManualEnrollmentAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentAllocation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEnrollmentAllocationBudgetRangeRule implements ManualEnrollmentAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualEnrollmentAllocation): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual enrollment allocation. */
export class ManualEnrollmentAllocationValidator {
  rules: ManualEnrollmentAllocationRule[];

  constructor(rules: ManualEnrollmentAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEnrollmentAllocation): string[] {
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

  requireValid(item: ManualEnrollmentAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEnrollmentAllocation[]): Map<string, string[]> {
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

export function defaultManualEnrollmentAllocationValidator(): ManualEnrollmentAllocationValidator {
  return new ManualEnrollmentAllocationValidator(
    [
      new ManualEnrollmentAllocationCodePrefixRule("X"),
      new ManualEnrollmentAllocationLocaleLengthRule(1000),
      new ManualEnrollmentAllocationCodeLengthRule(80),
      new ManualEnrollmentAllocationRequiredNameRule("manual enrollment allocation needs this field"),
      new ManualEnrollmentAllocationRequiredSourceRule("manual enrollment allocation needs this field"),
      new ManualEnrollmentAllocationBudgetRangeRule(6.1, 2715.7),
    ],
  );
}
