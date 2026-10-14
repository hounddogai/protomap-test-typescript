import { GlobalSuppressionAllocation } from "./global-suppression-allocation.js";

/** A rule a global suppression allocation must pass. Check returns its problems, or none. */
export interface GlobalSuppressionAllocationRule {
  check(item: GlobalSuppressionAllocation): string[];
}

export class GlobalSuppressionAllocationRequiredTitleRule implements GlobalSuppressionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSuppressionAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSuppressionAllocationCodeLengthRule implements GlobalSuppressionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSuppressionAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSuppressionAllocationTitleLengthRule implements GlobalSuppressionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSuppressionAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSuppressionAllocationPinnedGuardRule implements GlobalSuppressionAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalSuppressionAllocation): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a global suppression allocation. */
export class GlobalSuppressionAllocationValidator {
  rules: GlobalSuppressionAllocationRule[];

  constructor(rules: GlobalSuppressionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSuppressionAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSuppressionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSuppressionAllocation[]): Map<string, string[]> {
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

export function defaultGlobalSuppressionAllocationValidator(): GlobalSuppressionAllocationValidator {
  return new GlobalSuppressionAllocationValidator(
    [
      new GlobalSuppressionAllocationRequiredTitleRule("global suppression allocation needs this field"),
      new GlobalSuppressionAllocationCodeLengthRule(16),
      new GlobalSuppressionAllocationTitleLengthRule(80),
      new GlobalSuppressionAllocationPinnedGuardRule(16),
    ],
  );
}
