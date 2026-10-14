import { PreferenceVariance } from "./preference-variance.js";

/** A rule a preference variance must pass. Check returns its problems, or none. */
export interface PreferenceVarianceRule {
  check(item: PreferenceVariance): string[];
}

export class PreferenceVarianceStartsAtRangeRule implements PreferenceVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceVariance): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceVarianceImpressionsRangeRule implements PreferenceVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceVariance): string[] {
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

export class PreferenceVarianceRequiredLabelRule implements PreferenceVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceVarianceRequiredCodeRule implements PreferenceVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference variance. */
export class PreferenceVarianceValidator {
  rules: PreferenceVarianceRule[];

  constructor(rules: PreferenceVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceVariance): string[] {
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

  requireValid(item: PreferenceVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceVariance[]): Map<string, string[]> {
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

export function defaultPreferenceVarianceValidator(): PreferenceVarianceValidator {
  return new PreferenceVarianceValidator(
    [
      new PreferenceVarianceStartsAtRangeRule(16, 255),
      new PreferenceVarianceImpressionsRangeRule(120, 86400),
      new PreferenceVarianceRequiredLabelRule("preference variance needs an entry"),
      new PreferenceVarianceRequiredCodeRule("preference variance needs an entry"),
    ],
  );
}
