import { PreferenceEstimate } from "./preference-estimate.js";

/** A rule a preference estimate must pass. Check returns its problems, or none. */
export interface PreferenceEstimateRule {
  check(item: PreferenceEstimate): string[];
}

export class PreferenceEstimateTitleLengthRule implements PreferenceEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceEstimateFloorValueRangeRule implements PreferenceEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceEstimate): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceEstimateRequiredVariantRule implements PreferenceEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceEstimate): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceEstimateEndsAtRangeRule implements PreferenceEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceEstimate): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a preference estimate. */
export class PreferenceEstimateValidator {
  rules: PreferenceEstimateRule[];

  constructor(rules: PreferenceEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceEstimate): string[] {
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

  requireValid(item: PreferenceEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceEstimate[]): Map<string, string[]> {
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

export function defaultPreferenceEstimateValidator(): PreferenceEstimateValidator {
  return new PreferenceEstimateValidator(
    [
      new PreferenceEstimateTitleLengthRule(32),
      new PreferenceEstimateFloorValueRangeRule(5.5, 2012.7),
      new PreferenceEstimateRequiredVariantRule("preference estimate needs an entry"),
      new PreferenceEstimateEndsAtRangeRule(80, 3600),
    ],
  );
}
