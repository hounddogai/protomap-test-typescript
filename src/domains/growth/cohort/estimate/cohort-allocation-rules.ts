import { CohortAllocation } from "./cohort-allocation.js";

/** A rule a cohort allocation must pass. Check returns its problems, or none. */
export interface CohortAllocationRule {
  check(item: CohortAllocation): string[];
}

export class CohortAllocationTimezoneLengthRule implements CohortAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortAllocation): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortAllocationMinimumRangeRule implements CohortAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortAllocation): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortAllocationRequiredCodeRule implements CohortAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortAllocationCodePrefixRule implements CohortAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortAllocationRequiredChannelRule implements CohortAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortAllocation): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CohortAllocationRequiredTimezoneRule implements CohortAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortAllocation): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort allocation. */
export class CohortAllocationValidator {
  rules: CohortAllocationRule[];

  constructor(rules: CohortAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CohortAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortAllocation[]): Map<string, string[]> {
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

export function defaultCohortAllocationValidator(): CohortAllocationValidator {
  return new CohortAllocationValidator(
    [
      new CohortAllocationTimezoneLengthRule(86400),
      new CohortAllocationMinimumRangeRule(1.6, 1194.6),
      new CohortAllocationRequiredCodeRule("cohort allocation needs this field"),
      new CohortAllocationCodePrefixRule("ACM"),
      new CohortAllocationRequiredChannelRule("cohort allocation needs an entry"),
      new CohortAllocationRequiredTimezoneRule("cohort allocation needs a value"),
    ],
  );
}
