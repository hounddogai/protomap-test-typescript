import { ScheduledBranchAdjustment } from "./scheduled-branch-adjustment.js";

/** A rule a scheduled branch adjustment must pass. Check returns its problems, or none. */
export interface ScheduledBranchAdjustmentRule {
  check(item: ScheduledBranchAdjustment): string[];
}

export class ScheduledBranchAdjustmentTimezoneLengthRule implements ScheduledBranchAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBranchAdjustment): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBranchAdjustmentCodePrefixRule implements ScheduledBranchAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledBranchAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledBranchAdjustmentQuantityRangeRule implements ScheduledBranchAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBranchAdjustment): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledBranchAdjustmentRequiredNameRule implements ScheduledBranchAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBranchAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled branch adjustment. */
export class ScheduledBranchAdjustmentValidator {
  rules: ScheduledBranchAdjustmentRule[];

  constructor(rules: ScheduledBranchAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBranchAdjustment): string[] {
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

  requireValid(item: ScheduledBranchAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBranchAdjustment[]): Map<string, string[]> {
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

export function defaultScheduledBranchAdjustmentValidator(): ScheduledBranchAdjustmentValidator {
  return new ScheduledBranchAdjustmentValidator(
    [
      new ScheduledBranchAdjustmentTimezoneLengthRule(32),
      new ScheduledBranchAdjustmentCodePrefixRule("X"),
      new ScheduledBranchAdjustmentQuantityRangeRule(64, 1000),
      new ScheduledBranchAdjustmentRequiredNameRule("scheduled branch adjustment needs a value"),
    ],
  );
}
