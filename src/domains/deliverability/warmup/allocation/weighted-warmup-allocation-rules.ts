import * as text from "../../../../kit/text.js";
import { WeightedWarmupAllocation } from "./weighted-warmup-allocation.js";

/** A rule a weighted warmup allocation must pass. Check returns its problems, or none. */
export interface WeightedWarmupAllocationRule {
  check(item: WeightedWarmupAllocation): string[];
}

export class WeightedWarmupAllocationRequiredVariantRule implements WeightedWarmupAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWarmupAllocation): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWarmupAllocationTitleLengthRule implements WeightedWarmupAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWarmupAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWarmupAllocationAllowedPhoneRule implements WeightedWarmupAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedWarmupAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is blocked`];
    return [];
  }
}

export class WeightedWarmupAllocationCodePrefixRule implements WeightedWarmupAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedWarmupAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedWarmupAllocationLabelLengthRule implements WeightedWarmupAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWarmupAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWarmupAllocationRequiredLabelRule implements WeightedWarmupAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWarmupAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted warmup allocation. */
export class WeightedWarmupAllocationValidator {
  rules: WeightedWarmupAllocationRule[];

  constructor(rules: WeightedWarmupAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWarmupAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWarmupAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWarmupAllocation[]): Map<string, string[]> {
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

export function defaultWeightedWarmupAllocationValidator(): WeightedWarmupAllocationValidator {
  return new WeightedWarmupAllocationValidator(
    [
      new WeightedWarmupAllocationRequiredVariantRule("weighted warmup allocation needs this field"),
      new WeightedWarmupAllocationTitleLengthRule(1000),
      new WeightedWarmupAllocationAllowedPhoneRule([]),
      new WeightedWarmupAllocationCodePrefixRule("X"),
      new WeightedWarmupAllocationLabelLengthRule(1000),
      new WeightedWarmupAllocationRequiredLabelRule("weighted warmup allocation needs an entry"),
    ],
  );
}
