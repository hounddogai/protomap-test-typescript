import { ComplaintAllocation } from "./complaint-allocation.js";

/** A rule a complaint allocation must pass. Check returns its problems, or none. */
export interface ComplaintAllocationRule {
  check(item: ComplaintAllocation): string[];
}

export class ComplaintAllocationRequiredExternalRefRule implements ComplaintAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintAllocation): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintAllocationRequiredCodeRule implements ComplaintAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintAllocationExternalRefLengthRule implements ComplaintAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintAllocation): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintAllocationFrequencyCapRangeRule implements ComplaintAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintAllocation): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintAllocationCodeLengthRule implements ComplaintAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintAllocationNameLengthRule implements ComplaintAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint allocation. */
export class ComplaintAllocationValidator {
  rules: ComplaintAllocationRule[];

  constructor(rules: ComplaintAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintAllocation[]): Map<string, string[]> {
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

export function defaultComplaintAllocationValidator(): ComplaintAllocationValidator {
  return new ComplaintAllocationValidator(
    [
      new ComplaintAllocationRequiredExternalRefRule("complaint allocation needs a value"),
      new ComplaintAllocationRequiredCodeRule("complaint allocation needs a value"),
      new ComplaintAllocationExternalRefLengthRule(80),
      new ComplaintAllocationFrequencyCapRangeRule(255, 3600),
      new ComplaintAllocationCodeLengthRule(3600),
      new ComplaintAllocationNameLengthRule(64),
    ],
  );
}
