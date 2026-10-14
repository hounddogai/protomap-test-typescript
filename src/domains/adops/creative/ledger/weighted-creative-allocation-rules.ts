import * as text from "../../../../kit/text.js";
import { WeightedCreativeAllocation } from "./weighted-creative-allocation.js";

/** A rule a weighted creative allocation must pass. Check returns its problems, or none. */
export interface WeightedCreativeAllocationRule {
  check(item: WeightedCreativeAllocation): string[];
}

export class WeightedCreativeAllocationCodePrefixRule implements WeightedCreativeAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedCreativeAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedCreativeAllocationAllowedCodeRule implements WeightedCreativeAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedCreativeAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class WeightedCreativeAllocationRequiredCodeRule implements WeightedCreativeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreativeAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreativeAllocationNameLengthRule implements WeightedCreativeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreativeAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCreativeAllocationRequiredLocaleRule implements WeightedCreativeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreativeAllocation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreativeAllocationCodeLengthRule implements WeightedCreativeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreativeAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted creative allocation. */
export class WeightedCreativeAllocationValidator {
  rules: WeightedCreativeAllocationRule[];

  constructor(rules: WeightedCreativeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCreativeAllocation): string[] {
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

  requireValid(item: WeightedCreativeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCreativeAllocation[]): Map<string, string[]> {
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

export function defaultWeightedCreativeAllocationValidator(): WeightedCreativeAllocationValidator {
  return new WeightedCreativeAllocationValidator(
    [
      new WeightedCreativeAllocationCodePrefixRule("ACM"),
      new WeightedCreativeAllocationAllowedCodeRule([]),
      new WeightedCreativeAllocationRequiredCodeRule("weighted creative allocation needs an entry"),
      new WeightedCreativeAllocationNameLengthRule(16),
      new WeightedCreativeAllocationRequiredLocaleRule("weighted creative allocation needs this field"),
      new WeightedCreativeAllocationCodeLengthRule(3600),
    ],
  );
}
