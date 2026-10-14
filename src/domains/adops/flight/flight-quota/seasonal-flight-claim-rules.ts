import { SeasonalFlightClaim } from "./seasonal-flight-claim.js";

/** A rule a seasonal flight claim must pass. Check returns its problems, or none. */
export interface SeasonalFlightClaimRule {
  check(item: SeasonalFlightClaim): string[];
}

export class SeasonalFlightClaimRequiredLocaleRule implements SeasonalFlightClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFlightClaim): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFlightClaimTitleLengthRule implements SeasonalFlightClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFlightClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalFlightClaimBudgetRangeRule implements SeasonalFlightClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFlightClaim): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal flight claim. */
export class SeasonalFlightClaimValidator {
  rules: SeasonalFlightClaimRule[];

  constructor(rules: SeasonalFlightClaimRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFlightClaim): string[] {
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

  requireValid(item: SeasonalFlightClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFlightClaim[]): Map<string, string[]> {
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

export function defaultSeasonalFlightClaimValidator(): SeasonalFlightClaimValidator {
  return new SeasonalFlightClaimValidator(
    [
      new SeasonalFlightClaimRequiredLocaleRule("seasonal flight claim needs this field"),
      new SeasonalFlightClaimTitleLengthRule(86400),
      new SeasonalFlightClaimBudgetRangeRule(4.1, 229.1),
    ],
  );
}
