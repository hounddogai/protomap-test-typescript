import { StrictCsatClaim } from "./strict-csat-claim.js";

/** A rule a strict csat claim must pass. Check returns its problems, or none. */
export interface StrictCsatClaimRule {
  check(item: StrictCsatClaim): string[];
}

export class StrictCsatClaimRequiredSourceRule implements StrictCsatClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCsatClaim): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCsatClaimMinimumRangeRule implements StrictCsatClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCsatClaim): string[] {
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

export class StrictCsatClaimVisibleGuardRule implements StrictCsatClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictCsatClaim): string[] {
    if (item.visible && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a strict csat claim. */
export class StrictCsatClaimValidator {
  rules: StrictCsatClaimRule[];

  constructor(rules: StrictCsatClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCsatClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictCsatClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCsatClaim[]): Map<string, string[]> {
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

export function defaultStrictCsatClaimValidator(): StrictCsatClaimValidator {
  return new StrictCsatClaimValidator(
    [
      new StrictCsatClaimRequiredSourceRule("strict csat claim needs an entry"),
      new StrictCsatClaimMinimumRangeRule(2.7, 4722.6),
      new StrictCsatClaimVisibleGuardRule(1.5),
    ],
  );
}
