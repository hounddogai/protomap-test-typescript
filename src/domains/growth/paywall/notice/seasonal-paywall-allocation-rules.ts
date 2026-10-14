import { SeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

/** A rule a seasonal paywall allocation must pass. Check returns its problems, or none. */
export interface SeasonalPaywallAllocationRule {
  check(item: SeasonalPaywallAllocation): string[];
}

export class SeasonalPaywallAllocationNotesLengthRule implements SeasonalPaywallAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallAllocation): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPaywallAllocationCostRangeRule implements SeasonalPaywallAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPaywallAllocation): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalPaywallAllocationCodeLengthRule implements SeasonalPaywallAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPaywallAllocationRequiredNotesRule implements SeasonalPaywallAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallAllocation): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal paywall allocation. */
export class SeasonalPaywallAllocationValidator {
  rules: SeasonalPaywallAllocationRule[];

  constructor(rules: SeasonalPaywallAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPaywallAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalPaywallAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPaywallAllocation[]): Map<string, string[]> {
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

export function defaultSeasonalPaywallAllocationValidator(): SeasonalPaywallAllocationValidator {
  return new SeasonalPaywallAllocationValidator(
    [
      new SeasonalPaywallAllocationNotesLengthRule(1000),
      new SeasonalPaywallAllocationCostRangeRule(7.3, 2350.1),
      new SeasonalPaywallAllocationCodeLengthRule(255),
      new SeasonalPaywallAllocationRequiredNotesRule("seasonal paywall allocation needs this field"),
    ],
  );
}
