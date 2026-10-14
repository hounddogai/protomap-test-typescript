import { StrictJourneyRollup } from "./strict-journey-rollup.js";

/** A rule a strict journey rollup must pass. Check returns its problems, or none. */
export interface StrictJourneyRollupRule {
  check(item: StrictJourneyRollup): string[];
}

export class StrictJourneyRollupRequiredLabelRule implements StrictJourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictJourneyRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictJourneyRollupBudgetRangeRule implements StrictJourneyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictJourneyRollup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictJourneyRollupRequiredRegionRule implements StrictJourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictJourneyRollup): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict journey rollup. */
export class StrictJourneyRollupValidator {
  rules: StrictJourneyRollupRule[];

  constructor(rules: StrictJourneyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: StrictJourneyRollup): string[] {
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

  requireValid(item: StrictJourneyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictJourneyRollup[]): Map<string, string[]> {
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

export function defaultStrictJourneyRollupValidator(): StrictJourneyRollupValidator {
  return new StrictJourneyRollupValidator(
    [
      new StrictJourneyRollupRequiredLabelRule("strict journey rollup needs a value"),
      new StrictJourneyRollupBudgetRangeRule(2.7, 2184.8),
      new StrictJourneyRollupRequiredRegionRule("strict journey rollup needs an entry"),
    ],
  );
}
