import { AdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

/** A rule a adaptive exit rule bundle must pass. Check returns its problems, or none. */
export interface AdaptiveExitRuleBundleRule {
  check(item: AdaptiveExitRuleBundle): string[];
}

export class AdaptiveExitRuleBundleContactEmailLengthRule implements AdaptiveExitRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveExitRuleBundle): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveExitRuleBundleWeightRangeRule implements AdaptiveExitRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveExitRuleBundle): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveExitRuleBundlePhoneLengthRule implements AdaptiveExitRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveExitRuleBundle): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive exit rule bundle. */
export class AdaptiveExitRuleBundleValidator {
  rules: AdaptiveExitRuleBundleRule[];

  constructor(rules: AdaptiveExitRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveExitRuleBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveExitRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveExitRuleBundle[]): Map<string, string[]> {
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

export function defaultAdaptiveExitRuleBundleValidator(): AdaptiveExitRuleBundleValidator {
  return new AdaptiveExitRuleBundleValidator(
    [
      new AdaptiveExitRuleBundleContactEmailLengthRule(80),
      new AdaptiveExitRuleBundleWeightRangeRule(3.2, 2841.5),
      new AdaptiveExitRuleBundlePhoneLengthRule(16),
    ],
  );
}
