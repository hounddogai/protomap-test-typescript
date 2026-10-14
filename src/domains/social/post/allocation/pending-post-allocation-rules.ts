import { PendingPostAllocation } from "./pending-post-allocation.js";

/** A rule a pending post allocation must pass. Check returns its problems, or none. */
export interface PendingPostAllocationRule {
  check(item: PendingPostAllocation): string[];
}

export class PendingPostAllocationSequenceRangeRule implements PendingPostAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPostAllocation): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingPostAllocationRequiredNameRule implements PendingPostAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPostAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPostAllocationRequiredCodeRule implements PendingPostAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPostAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPostAllocationStartsAtRangeRule implements PendingPostAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPostAllocation): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingPostAllocationCodeLengthRule implements PendingPostAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPostAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending post allocation. */
export class PendingPostAllocationValidator {
  rules: PendingPostAllocationRule[];

  constructor(rules: PendingPostAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPostAllocation): string[] {
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

  requireValid(item: PendingPostAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPostAllocation[]): Map<string, string[]> {
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

export function defaultPendingPostAllocationValidator(): PendingPostAllocationValidator {
  return new PendingPostAllocationValidator(
    [
      new PendingPostAllocationSequenceRangeRule(1000, 86400),
      new PendingPostAllocationRequiredNameRule("pending post allocation needs a value"),
      new PendingPostAllocationRequiredCodeRule("pending post allocation needs a value"),
      new PendingPostAllocationStartsAtRangeRule(16, 64),
      new PendingPostAllocationCodeLengthRule(255),
    ],
  );
}
