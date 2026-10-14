import { PlacementEstimate } from "./placement-estimate.js";

/** A rule a placement estimate must pass. Check returns its problems, or none. */
export interface PlacementEstimateRule {
  check(item: PlacementEstimate): string[];
}

export class PlacementEstimateLocaleLengthRule implements PlacementEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementEstimate): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementEstimateRequiredLocaleRule implements PlacementEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementEstimate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementEstimateEndsAtRangeRule implements PlacementEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementEstimate): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementEstimateRequiredCodeRule implements PlacementEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement estimate. */
export class PlacementEstimateValidator {
  rules: PlacementEstimateRule[];

  constructor(rules: PlacementEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementEstimate): string[] {
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

  requireValid(item: PlacementEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementEstimate[]): Map<string, string[]> {
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

export function defaultPlacementEstimateValidator(): PlacementEstimateValidator {
  return new PlacementEstimateValidator(
    [
      new PlacementEstimateLocaleLengthRule(16),
      new PlacementEstimateRequiredLocaleRule("placement estimate needs a value"),
      new PlacementEstimateEndsAtRangeRule(16, 32),
      new PlacementEstimateRequiredCodeRule("placement estimate needs a value"),
    ],
  );
}
