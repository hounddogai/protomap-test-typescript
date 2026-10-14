import { GlobalStepAllocation } from "./global-step-allocation.js";

/** A rule a global step allocation must pass. Check returns its problems, or none. */
export interface GlobalStepAllocationRule {
  check(item: GlobalStepAllocation): string[];
}

export class GlobalStepAllocationUpdatedAtRangeRule implements GlobalStepAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalStepAllocation): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalStepAllocationJourneyIdLengthRule implements GlobalStepAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepAllocation): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalStepAllocationUnitLengthRule implements GlobalStepAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepAllocation): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global step allocation. */
export class GlobalStepAllocationValidator {
  rules: GlobalStepAllocationRule[];

  constructor(rules: GlobalStepAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalStepAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalStepAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalStepAllocation[]): Map<string, string[]> {
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

export function defaultGlobalStepAllocationValidator(): GlobalStepAllocationValidator {
  return new GlobalStepAllocationValidator(
    [
      new GlobalStepAllocationUpdatedAtRangeRule(32, 64),
      new GlobalStepAllocationJourneyIdLengthRule(120),
      new GlobalStepAllocationUnitLengthRule(86400),
    ],
  );
}
