import { ApprovalAllocation } from "./approval-allocation.js";

/** A rule a approval allocation must pass. Check returns its problems, or none. */
export interface ApprovalAllocationRule {
  check(item: ApprovalAllocation): string[];
}

export class ApprovalAllocationExternalRefLengthRule implements ApprovalAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAllocation): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAllocationTitleLengthRule implements ApprovalAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAllocationMinimumRangeRule implements ApprovalAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalAllocation): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalAllocationCodeLengthRule implements ApprovalAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAllocationRequiredExternalRefRule implements ApprovalAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalAllocation): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalAllocationEndsAtRangeRule implements ApprovalAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalAllocation): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a approval allocation. */
export class ApprovalAllocationValidator {
  rules: ApprovalAllocationRule[];

  constructor(rules: ApprovalAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalAllocation[]): Map<string, string[]> {
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

export function defaultApprovalAllocationValidator(): ApprovalAllocationValidator {
  return new ApprovalAllocationValidator(
    [
      new ApprovalAllocationExternalRefLengthRule(3600),
      new ApprovalAllocationTitleLengthRule(86400),
      new ApprovalAllocationMinimumRangeRule(4, 3689.6),
      new ApprovalAllocationCodeLengthRule(1000),
      new ApprovalAllocationRequiredExternalRefRule("approval allocation needs a value"),
      new ApprovalAllocationEndsAtRangeRule(32, 32),
    ],
  );
}
