import { ScheduledRetentionAllocation } from "./scheduled-retention-allocation.js";

/** A rule a scheduled retention allocation must pass. Check returns its problems, or none. */
export interface ScheduledRetentionAllocationRule {
  check(item: ScheduledRetentionAllocation): string[];
}

export class ScheduledRetentionAllocationCodePrefixRule implements ScheduledRetentionAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledRetentionAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledRetentionAllocationMaximumRangeRule implements ScheduledRetentionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRetentionAllocation): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledRetentionAllocationRequiredLabelRule implements ScheduledRetentionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRetentionAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRetentionAllocationRequiredNameRule implements ScheduledRetentionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRetentionAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled retention allocation. */
export class ScheduledRetentionAllocationValidator {
  rules: ScheduledRetentionAllocationRule[];

  constructor(rules: ScheduledRetentionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRetentionAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledRetentionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRetentionAllocation[]): Map<string, string[]> {
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

export function defaultScheduledRetentionAllocationValidator(): ScheduledRetentionAllocationValidator {
  return new ScheduledRetentionAllocationValidator(
    [
      new ScheduledRetentionAllocationCodePrefixRule("X"),
      new ScheduledRetentionAllocationMaximumRangeRule(6.9, 623.9),
      new ScheduledRetentionAllocationRequiredLabelRule("scheduled retention allocation needs a value"),
      new ScheduledRetentionAllocationRequiredNameRule("scheduled retention allocation needs a value"),
    ],
  );
}
