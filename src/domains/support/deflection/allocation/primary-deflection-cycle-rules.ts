import { PrimaryDeflectionCycle } from "./primary-deflection-cycle.js";

/** A rule a primary deflection cycle must pass. Check returns its problems, or none. */
export interface PrimaryDeflectionCycleRule {
  check(item: PrimaryDeflectionCycle): string[];
}

export class PrimaryDeflectionCycleRequiredCampaignRefRule implements PrimaryDeflectionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryDeflectionCycle): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryDeflectionCycleRequiredCodeRule implements PrimaryDeflectionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryDeflectionCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryDeflectionCycleBudgetRangeRule implements PrimaryDeflectionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDeflectionCycle): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary deflection cycle. */
export class PrimaryDeflectionCycleValidator {
  rules: PrimaryDeflectionCycleRule[];

  constructor(rules: PrimaryDeflectionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryDeflectionCycle): string[] {
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

  requireValid(item: PrimaryDeflectionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryDeflectionCycle[]): Map<string, string[]> {
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

export function defaultPrimaryDeflectionCycleValidator(): PrimaryDeflectionCycleValidator {
  return new PrimaryDeflectionCycleValidator(
    [
      new PrimaryDeflectionCycleRequiredCampaignRefRule("primary deflection cycle needs an entry"),
      new PrimaryDeflectionCycleRequiredCodeRule("primary deflection cycle needs this field"),
      new PrimaryDeflectionCycleBudgetRangeRule(3.1, 4638.1),
    ],
  );
}
