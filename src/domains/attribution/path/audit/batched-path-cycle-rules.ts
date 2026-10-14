import * as text from "../../../../kit/text.js";
import { BatchedPathCycle } from "./batched-path-cycle.js";

/** A rule a batched path cycle must pass. Check returns its problems, or none. */
export interface BatchedPathCycleRule {
  check(item: BatchedPathCycle): string[];
}

export class BatchedPathCycleAllowedRegionRule implements BatchedPathCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPathCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is missing`];
    return [];
  }
}

export class BatchedPathCycleCodeLengthRule implements BatchedPathCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPathCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPathCycleRequiredChannelRule implements BatchedPathCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathCycle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPathCycleRequiredRegionRule implements BatchedPathCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathCycle): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched path cycle. */
export class BatchedPathCycleValidator {
  rules: BatchedPathCycleRule[];

  constructor(rules: BatchedPathCycleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPathCycle): string[] {
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

  requireValid(item: BatchedPathCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPathCycle[]): Map<string, string[]> {
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

export function defaultBatchedPathCycleValidator(): BatchedPathCycleValidator {
  return new BatchedPathCycleValidator(
    [
      new BatchedPathCycleAllowedRegionRule([]),
      new BatchedPathCycleCodeLengthRule(64),
      new BatchedPathCycleRequiredChannelRule("batched path cycle needs an entry"),
      new BatchedPathCycleRequiredRegionRule("batched path cycle needs an entry"),
    ],
  );
}
