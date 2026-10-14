import { CappedPathAllocation } from "./capped-path-allocation.js";

/** A rule a capped path allocation must pass. Check returns its problems, or none. */
export interface CappedPathAllocationRule {
  check(item: CappedPathAllocation): string[];
}

export class CappedPathAllocationFrequencyCapRangeRule implements CappedPathAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPathAllocation): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedPathAllocationRequiredNameRule implements CappedPathAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPathAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPathAllocationRateRangeRule implements CappedPathAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPathAllocation): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped path allocation. */
export class CappedPathAllocationValidator {
  rules: CappedPathAllocationRule[];

  constructor(rules: CappedPathAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPathAllocation): string[] {
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

  requireValid(item: CappedPathAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPathAllocation[]): Map<string, string[]> {
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

export function defaultCappedPathAllocationValidator(): CappedPathAllocationValidator {
  return new CappedPathAllocationValidator(
    [
      new CappedPathAllocationFrequencyCapRangeRule(80, 86400),
      new CappedPathAllocationRequiredNameRule("capped path allocation needs an entry"),
      new CappedPathAllocationRateRangeRule(7, 1711),
    ],
  );
}
