import * as text from "../../../../kit/text.js";
import { BatchedProofCycle } from "./batched-proof-cycle.js";

/** A rule a batched proof cycle must pass. Check returns its problems, or none. */
export interface BatchedProofCycleRule {
  check(item: BatchedProofCycle): string[];
}

export class BatchedProofCycleChecksumLengthRule implements BatchedProofCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedProofCycle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedProofCycleAllowedCodeRule implements BatchedProofCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedProofCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class BatchedProofCycleCodePrefixRule implements BatchedProofCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedProofCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched proof cycle. */
export class BatchedProofCycleValidator {
  rules: BatchedProofCycleRule[];

  constructor(rules: BatchedProofCycleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedProofCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedProofCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedProofCycle[]): Map<string, string[]> {
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

export function defaultBatchedProofCycleValidator(): BatchedProofCycleValidator {
  return new BatchedProofCycleValidator(
    [
      new BatchedProofCycleChecksumLengthRule(255),
      new BatchedProofCycleAllowedCodeRule([]),
      new BatchedProofCycleCodePrefixRule("X"),
    ],
  );
}
