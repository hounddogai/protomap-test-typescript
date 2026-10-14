import { RegionalFrequencyAllocation } from "./regional-frequency-allocation.js";

/** A rule a regional frequency allocation must pass. Check returns its problems, or none. */
export interface RegionalFrequencyAllocationRule {
  check(item: RegionalFrequencyAllocation): string[];
}

export class RegionalFrequencyAllocationTimezoneLengthRule implements RegionalFrequencyAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalFrequencyAllocation): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalFrequencyAllocationRequiredTimezoneRule implements RegionalFrequencyAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalFrequencyAllocation): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalFrequencyAllocationCodeLengthRule implements RegionalFrequencyAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalFrequencyAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalFrequencyAllocationWindowDaysRangeRule implements RegionalFrequencyAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalFrequencyAllocation): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional frequency allocation. */
export class RegionalFrequencyAllocationValidator {
  rules: RegionalFrequencyAllocationRule[];

  constructor(rules: RegionalFrequencyAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalFrequencyAllocation): string[] {
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

  requireValid(item: RegionalFrequencyAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalFrequencyAllocation[]): Map<string, string[]> {
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

export function defaultRegionalFrequencyAllocationValidator(): RegionalFrequencyAllocationValidator {
  return new RegionalFrequencyAllocationValidator(
    [
      new RegionalFrequencyAllocationTimezoneLengthRule(120),
      new RegionalFrequencyAllocationRequiredTimezoneRule("regional frequency allocation needs a value"),
      new RegionalFrequencyAllocationCodeLengthRule(255),
      new RegionalFrequencyAllocationWindowDaysRangeRule(80, 3600),
    ],
  );
}
