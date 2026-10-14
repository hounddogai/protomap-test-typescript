import { WeightedBranchPreference } from "./weighted-branch-preference.js";

/** A rule a weighted branch preference must pass. Check returns its problems, or none. */
export interface WeightedBranchPreferenceRule {
  check(item: WeightedBranchPreference): string[];
}

export class WeightedBranchPreferenceCodePrefixRule implements WeightedBranchPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedBranchPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedBranchPreferenceRequiredNameRule implements WeightedBranchPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBranchPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBranchPreferenceRequiredChannelRule implements WeightedBranchPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBranchPreference): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBranchPreferenceApprovedGuardRule implements WeightedBranchPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedBranchPreference): string[] {
    if (item.approved && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a weighted branch preference. */
export class WeightedBranchPreferenceValidator {
  rules: WeightedBranchPreferenceRule[];

  constructor(rules: WeightedBranchPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBranchPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedBranchPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBranchPreference[]): Map<string, string[]> {
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

export function defaultWeightedBranchPreferenceValidator(): WeightedBranchPreferenceValidator {
  return new WeightedBranchPreferenceValidator(
    [
      new WeightedBranchPreferenceCodePrefixRule("Q"),
      new WeightedBranchPreferenceRequiredNameRule("weighted branch preference needs a value"),
      new WeightedBranchPreferenceRequiredChannelRule("weighted branch preference needs this field"),
      new WeightedBranchPreferenceApprovedGuardRule(1000),
    ],
  );
}
