import { StrictPacingRollup } from "./strict-pacing-rollup.js";

/** A rule a strict pacing rollup must pass. Check returns its problems, or none. */
export interface StrictPacingRollupRule {
  check(item: StrictPacingRollup): string[];
}

export class StrictPacingRollupRequiredPhoneRule implements StrictPacingRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPacingRollup): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPacingRollupConversionRateRangeRule implements StrictPacingRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPacingRollup): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPacingRollupPhoneLengthRule implements StrictPacingRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPacingRollup): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPacingRollupRequiredCohortRule implements StrictPacingRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPacingRollup): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict pacing rollup. */
export class StrictPacingRollupValidator {
  rules: StrictPacingRollupRule[];

  constructor(rules: StrictPacingRollupRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPacingRollup): string[] {
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

  requireValid(item: StrictPacingRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPacingRollup[]): Map<string, string[]> {
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

export function defaultStrictPacingRollupValidator(): StrictPacingRollupValidator {
  return new StrictPacingRollupValidator(
    [
      new StrictPacingRollupRequiredPhoneRule("strict pacing rollup needs an entry"),
      new StrictPacingRollupConversionRateRangeRule(4.3, 2334.7),
      new StrictPacingRollupPhoneLengthRule(64),
      new StrictPacingRollupRequiredCohortRule("strict pacing rollup needs this field"),
    ],
  );
}
