import * as text from "../../../../kit/text.js";
import { RollingFrequencyAllocation } from "./rolling-frequency-allocation.js";

/** A rule a rolling frequency allocation must pass. Check returns its problems, or none. */
export interface RollingFrequencyAllocationRule {
  check(item: RollingFrequencyAllocation): string[];
}

export class RollingFrequencyAllocationBidRangeRule implements RollingFrequencyAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFrequencyAllocation): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingFrequencyAllocationAllowedNameRule implements RollingFrequencyAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFrequencyAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class RollingFrequencyAllocationCodePrefixRule implements RollingFrequencyAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingFrequencyAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling frequency allocation. */
export class RollingFrequencyAllocationValidator {
  rules: RollingFrequencyAllocationRule[];

  constructor(rules: RollingFrequencyAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFrequencyAllocation): string[] {
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

  requireValid(item: RollingFrequencyAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFrequencyAllocation[]): Map<string, string[]> {
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

export function defaultRollingFrequencyAllocationValidator(): RollingFrequencyAllocationValidator {
  return new RollingFrequencyAllocationValidator(
    [
      new RollingFrequencyAllocationBidRangeRule(3.3, 2692.6),
      new RollingFrequencyAllocationAllowedNameRule(["seasonal", "lenient"]),
      new RollingFrequencyAllocationCodePrefixRule("X"),
    ],
  );
}
