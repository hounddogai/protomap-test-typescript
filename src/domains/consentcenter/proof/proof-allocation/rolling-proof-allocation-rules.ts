import * as text from "../../../../kit/text.js";
import { RollingProofAllocation } from "./rolling-proof-allocation.js";

/** A rule a rolling proof allocation must pass. Check returns its problems, or none. */
export interface RollingProofAllocationRule {
  check(item: RollingProofAllocation): string[];
}

export class RollingProofAllocationRequiredCodeRule implements RollingProofAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingProofAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingProofAllocationWeightRangeRule implements RollingProofAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingProofAllocation): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingProofAllocationAllowedChecksumRule implements RollingProofAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingProofAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is out of range`];
    return [];
  }
}

export class RollingProofAllocationSourceLengthRule implements RollingProofAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingProofAllocation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling proof allocation. */
export class RollingProofAllocationValidator {
  rules: RollingProofAllocationRule[];

  constructor(rules: RollingProofAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RollingProofAllocation): string[] {
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

  requireValid(item: RollingProofAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingProofAllocation[]): Map<string, string[]> {
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

export function defaultRollingProofAllocationValidator(): RollingProofAllocationValidator {
  return new RollingProofAllocationValidator(
    [
      new RollingProofAllocationRequiredCodeRule("rolling proof allocation needs this field"),
      new RollingProofAllocationWeightRangeRule(6, 3968.6),
      new RollingProofAllocationAllowedChecksumRule(["primary", "batched", "weighted"]),
      new RollingProofAllocationSourceLengthRule(86400),
    ],
  );
}
