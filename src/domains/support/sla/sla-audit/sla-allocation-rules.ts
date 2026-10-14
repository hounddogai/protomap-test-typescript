import { SlaAllocation } from "./sla-allocation.js";

/** A rule a sla allocation must pass. Check returns its problems, or none. */
export interface SlaAllocationRule {
  check(item: SlaAllocation): string[];
}

export class SlaAllocationCodeLengthRule implements SlaAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaAllocationAttemptsRangeRule implements SlaAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaAllocation): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaAllocationChannelLengthRule implements SlaAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAllocation): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla allocation. */
export class SlaAllocationValidator {
  rules: SlaAllocationRule[];

  constructor(rules: SlaAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: SlaAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaAllocation[]): Map<string, string[]> {
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

export function defaultSlaAllocationValidator(): SlaAllocationValidator {
  return new SlaAllocationValidator(
    [
      new SlaAllocationCodeLengthRule(16),
      new SlaAllocationAttemptsRangeRule(64, 80),
      new SlaAllocationChannelLengthRule(64),
    ],
  );
}
