import { GlobalPacingAllocation } from "./global-pacing-allocation.js";

/** A rule a global pacing allocation must pass. Check returns its problems, or none. */
export interface GlobalPacingAllocationRule {
  check(item: GlobalPacingAllocation): string[];
}

export class GlobalPacingAllocationStartsAtRangeRule implements GlobalPacingAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPacingAllocation): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPacingAllocationBudgetRangeRule implements GlobalPacingAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPacingAllocation): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPacingAllocationMinimumRangeRule implements GlobalPacingAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPacingAllocation): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalPacingAllocationCodeLengthRule implements GlobalPacingAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPacingAllocationRequiredCodeRule implements GlobalPacingAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPacingAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPacingAllocationNameLengthRule implements GlobalPacingAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global pacing allocation. */
export class GlobalPacingAllocationValidator {
  rules: GlobalPacingAllocationRule[];

  constructor(rules: GlobalPacingAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPacingAllocation): string[] {
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

  requireValid(item: GlobalPacingAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPacingAllocation[]): Map<string, string[]> {
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

export function defaultGlobalPacingAllocationValidator(): GlobalPacingAllocationValidator {
  return new GlobalPacingAllocationValidator(
    [
      new GlobalPacingAllocationStartsAtRangeRule(32, 1000),
      new GlobalPacingAllocationBudgetRangeRule(5, 4346.2),
      new GlobalPacingAllocationMinimumRangeRule(5.2, 2160.6),
      new GlobalPacingAllocationCodeLengthRule(120),
      new GlobalPacingAllocationRequiredCodeRule("global pacing allocation needs this field"),
      new GlobalPacingAllocationNameLengthRule(16),
    ],
  );
}
