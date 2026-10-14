import { WeightedPreferenceBaseline } from "./weighted-preference-baseline.js";

/** A rule a weighted preference baseline must pass. Check returns its problems, or none. */
export interface WeightedPreferenceBaselineRule {
  check(item: WeightedPreferenceBaseline): string[];
}

export class WeightedPreferenceBaselineRequiredNameRule implements WeightedPreferenceBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferenceBaselineCodePrefixRule implements WeightedPreferenceBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedPreferenceBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedPreferenceBaselineAudienceIdLengthRule implements WeightedPreferenceBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPreferenceBaseline): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted preference baseline. */
export class WeightedPreferenceBaselineValidator {
  rules: WeightedPreferenceBaselineRule[];

  constructor(rules: WeightedPreferenceBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPreferenceBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPreferenceBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPreferenceBaseline[]): Map<string, string[]> {
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

export function defaultWeightedPreferenceBaselineValidator(): WeightedPreferenceBaselineValidator {
  return new WeightedPreferenceBaselineValidator(
    [
      new WeightedPreferenceBaselineRequiredNameRule("weighted preference baseline needs an entry"),
      new WeightedPreferenceBaselineCodePrefixRule("ACM"),
      new WeightedPreferenceBaselineAudienceIdLengthRule(86400),
    ],
  );
}
