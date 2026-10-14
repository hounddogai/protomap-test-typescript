import { ManualChallengeTier } from "./manual-challenge-tier.js";

/** A rule a manual challenge tier must pass. Check returns its problems, or none. */
export interface ManualChallengeTierRule {
  check(item: ManualChallengeTier): string[];
}

export class ManualChallengeTierRequiredCountryRule implements ManualChallengeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeTier): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ManualChallengeTierCodeLengthRule implements ManualChallengeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualChallengeTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualChallengeTierMinimumRangeRule implements ManualChallengeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualChallengeTier): string[] {
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

/** Runs every rule of a manual challenge tier. */
export class ManualChallengeTierValidator {
  rules: ManualChallengeTierRule[];

  constructor(rules: ManualChallengeTierRule[]) {
    this.rules = rules;
  }

  validate(item: ManualChallengeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualChallengeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualChallengeTier[]): Map<string, string[]> {
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

export function defaultManualChallengeTierValidator(): ManualChallengeTierValidator {
  return new ManualChallengeTierValidator(
    [
      new ManualChallengeTierRequiredCountryRule("manual challenge tier needs this field"),
      new ManualChallengeTierCodeLengthRule(255),
      new ManualChallengeTierMinimumRangeRule(7.2, 3525.3),
    ],
  );
}
