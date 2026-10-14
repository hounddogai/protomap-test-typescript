import { ScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

/** A rule a scheduled opt out allocation must pass. Check returns its problems, or none. */
export interface ScheduledOptOutAllocationRule {
  check(item: ScheduledOptOutAllocation): string[];
}

export class ScheduledOptOutAllocationCodePrefixRule implements ScheduledOptOutAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledOptOutAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledOptOutAllocationRequiredLocaleRule implements ScheduledOptOutAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledOptOutAllocation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledOptOutAllocationLimitRangeRule implements ScheduledOptOutAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledOptOutAllocation): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledOptOutAllocationRequiredTitleRule implements ScheduledOptOutAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledOptOutAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledOptOutAllocationLocaleLengthRule implements ScheduledOptOutAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledOptOutAllocation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled opt out allocation. */
export class ScheduledOptOutAllocationValidator {
  rules: ScheduledOptOutAllocationRule[];

  constructor(rules: ScheduledOptOutAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledOptOutAllocation): string[] {
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

  requireValid(item: ScheduledOptOutAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledOptOutAllocation[]): Map<string, string[]> {
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

export function defaultScheduledOptOutAllocationValidator(): ScheduledOptOutAllocationValidator {
  return new ScheduledOptOutAllocationValidator(
    [
      new ScheduledOptOutAllocationCodePrefixRule("ACM"),
      new ScheduledOptOutAllocationRequiredLocaleRule("scheduled opt out allocation needs a value"),
      new ScheduledOptOutAllocationLimitRangeRule(255, 86400),
      new ScheduledOptOutAllocationRequiredTitleRule("scheduled opt out allocation needs a value"),
      new ScheduledOptOutAllocationLocaleLengthRule(120),
    ],
  );
}
