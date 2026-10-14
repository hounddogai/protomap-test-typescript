import { JourneyPreference } from "./journey-preference.js";

/** A rule a journey preference must pass. Check returns its problems, or none. */
export interface JourneyPreferenceRule {
  check(item: JourneyPreference): string[];
}

export class JourneyPreferenceRequiredRegionRule implements JourneyPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyPreference): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyPreferenceAmountRangeRule implements JourneyPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyPreference): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyPreferenceRequiredTitleRule implements JourneyPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey preference. */
export class JourneyPreferenceValidator {
  rules: JourneyPreferenceRule[];

  constructor(rules: JourneyPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyPreference[]): Map<string, string[]> {
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

export function defaultJourneyPreferenceValidator(): JourneyPreferenceValidator {
  return new JourneyPreferenceValidator(
    [
      new JourneyPreferenceRequiredRegionRule("journey preference needs this field"),
      new JourneyPreferenceAmountRangeRule(7.4, 4916.5),
      new JourneyPreferenceRequiredTitleRule("journey preference needs this field"),
    ],
  );
}
