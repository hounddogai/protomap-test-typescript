import * as text from "../../../../kit/text.js";
import { ManualTierAllocation } from "./manual-tier-allocation.js";

/** A rule a manual tier allocation must pass. Check returns its problems, or none. */
export interface ManualTierAllocationRule {
  check(item: ManualTierAllocation): string[];
}

export class ManualTierAllocationCodeLengthRule implements ManualTierAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierAllocationAllowedUnitRule implements ManualTierAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTierAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is below minimum`];
    return [];
  }
}

export class ManualTierAllocationRequiredRegionRule implements ManualTierAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTierAllocation): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTierAllocationMaximumRangeRule implements ManualTierAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTierAllocation): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualTierAllocationCodePrefixRule implements ManualTierAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualTierAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualTierAllocationRegionLengthRule implements ManualTierAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierAllocation): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual tier allocation. */
export class ManualTierAllocationValidator {
  rules: ManualTierAllocationRule[];

  constructor(rules: ManualTierAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTierAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTierAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTierAllocation[]): Map<string, string[]> {
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

export function defaultManualTierAllocationValidator(): ManualTierAllocationValidator {
  return new ManualTierAllocationValidator(
    [
      new ManualTierAllocationCodeLengthRule(3600),
      new ManualTierAllocationAllowedUnitRule(["capped", "capped", "manual"]),
      new ManualTierAllocationRequiredRegionRule("manual tier allocation needs a value"),
      new ManualTierAllocationMaximumRangeRule(7.3, 915.1),
      new ManualTierAllocationCodePrefixRule("OPS"),
      new ManualTierAllocationRegionLengthRule(255),
    ],
  );
}
