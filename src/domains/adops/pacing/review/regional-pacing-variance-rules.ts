import { RegionalPacingVariance } from "./regional-pacing-variance.js";

/** A rule a regional pacing variance must pass. Check returns its problems, or none. */
export interface RegionalPacingVarianceRule {
  check(item: RegionalPacingVariance): string[];
}

export class RegionalPacingVarianceSequenceRangeRule implements RegionalPacingVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPacingVariance): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPacingVarianceApprovedGuardRule implements RegionalPacingVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalPacingVariance): string[] {
    if (item.approved && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class RegionalPacingVarianceImpressionsRangeRule implements RegionalPacingVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPacingVariance): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional pacing variance. */
export class RegionalPacingVarianceValidator {
  rules: RegionalPacingVarianceRule[];

  constructor(rules: RegionalPacingVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPacingVariance): string[] {
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

  requireValid(item: RegionalPacingVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPacingVariance[]): Map<string, string[]> {
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

export function defaultRegionalPacingVarianceValidator(): RegionalPacingVarianceValidator {
  return new RegionalPacingVarianceValidator(
    [
      new RegionalPacingVarianceSequenceRangeRule(120, 1000),
      new RegionalPacingVarianceApprovedGuardRule(3600),
      new RegionalPacingVarianceImpressionsRangeRule(80, 255),
    ],
  );
}
