import { AdaptiveDoubleOptInGroup } from "./adaptive-double-opt-in-group.js";

/** A rule a adaptive double opt in group must pass. Check returns its problems, or none. */
export interface AdaptiveDoubleOptInGroupRule {
  check(item: AdaptiveDoubleOptInGroup): string[];
}

export class AdaptiveDoubleOptInGroupThresholdRangeRule implements AdaptiveDoubleOptInGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDoubleOptInGroup): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveDoubleOptInGroupCodeLengthRule implements AdaptiveDoubleOptInGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDoubleOptInGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDoubleOptInGroupCodePrefixRule implements AdaptiveDoubleOptInGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveDoubleOptInGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive double opt in group. */
export class AdaptiveDoubleOptInGroupValidator {
  rules: AdaptiveDoubleOptInGroupRule[];

  constructor(rules: AdaptiveDoubleOptInGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDoubleOptInGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveDoubleOptInGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDoubleOptInGroup[]): Map<string, string[]> {
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

export function defaultAdaptiveDoubleOptInGroupValidator(): AdaptiveDoubleOptInGroupValidator {
  return new AdaptiveDoubleOptInGroupValidator(
    [
      new AdaptiveDoubleOptInGroupThresholdRangeRule(4.3, 4797.7),
      new AdaptiveDoubleOptInGroupCodeLengthRule(3600),
      new AdaptiveDoubleOptInGroupCodePrefixRule("Q"),
    ],
  );
}
