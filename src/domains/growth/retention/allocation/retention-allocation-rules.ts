import { RetentionAllocation } from "./retention-allocation.js";

/** A rule a retention allocation must pass. Check returns its problems, or none. */
export interface RetentionAllocationRule {
  check(item: RetentionAllocation): string[];
}

export class RetentionAllocationLabelLengthRule implements RetentionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionAllocationOpenRateRangeRule implements RetentionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAllocation): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionAllocationRequiredChannelRule implements RetentionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionAllocation): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention allocation. */
export class RetentionAllocationValidator {
  rules: RetentionAllocationRule[];

  constructor(rules: RetentionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionAllocation): string[] {
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

  requireValid(item: RetentionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionAllocation[]): Map<string, string[]> {
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

export function defaultRetentionAllocationValidator(): RetentionAllocationValidator {
  return new RetentionAllocationValidator(
    [
      new RetentionAllocationLabelLengthRule(80),
      new RetentionAllocationOpenRateRangeRule(1, 4531.1),
      new RetentionAllocationRequiredChannelRule("retention allocation needs an entry"),
    ],
  );
}
