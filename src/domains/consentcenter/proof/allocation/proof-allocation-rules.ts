import * as text from "../../../../kit/text.js";
import { ProofAllocation } from "./proof-allocation.js";

/** A rule a proof allocation must pass. Check returns its problems, or none. */
export interface ProofAllocationRule {
  check(item: ProofAllocation): string[];
}

export class ProofAllocationRequiredLocaleRule implements ProofAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofAllocation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ProofAllocationCapacityRangeRule implements ProofAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAllocation): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofAllocationVariantLengthRule implements ProofAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAllocation): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAllocationCodeLengthRule implements ProofAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAllocationAllowedLocaleRule implements ProofAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

export class ProofAllocationLocaleLengthRule implements ProofAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAllocation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a proof allocation. */
export class ProofAllocationValidator {
  rules: ProofAllocationRule[];

  constructor(rules: ProofAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ProofAllocation): string[] {
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

  requireValid(item: ProofAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofAllocation[]): Map<string, string[]> {
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

export function defaultProofAllocationValidator(): ProofAllocationValidator {
  return new ProofAllocationValidator(
    [
      new ProofAllocationRequiredLocaleRule("proof allocation needs a value"),
      new ProofAllocationCapacityRangeRule(80, 255),
      new ProofAllocationVariantLengthRule(120),
      new ProofAllocationCodeLengthRule(86400),
      new ProofAllocationAllowedLocaleRule([]),
      new ProofAllocationLocaleLengthRule(255),
    ],
  );
}
