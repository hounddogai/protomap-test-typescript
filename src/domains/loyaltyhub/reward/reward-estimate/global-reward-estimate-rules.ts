import { GlobalRewardEstimate } from "./global-reward-estimate.js";

/** A rule a global reward estimate must pass. Check returns its problems, or none. */
export interface GlobalRewardEstimateRule {
  check(item: GlobalRewardEstimate): string[];
}

export class GlobalRewardEstimateRequiredCodeRule implements GlobalRewardEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardEstimateSummaryLengthRule implements GlobalRewardEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardEstimate): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardEstimateCodePrefixRule implements GlobalRewardEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRewardEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global reward estimate. */
export class GlobalRewardEstimateValidator {
  rules: GlobalRewardEstimateRule[];

  constructor(rules: GlobalRewardEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRewardEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardEstimate[]): Map<string, string[]> {
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

export function defaultGlobalRewardEstimateValidator(): GlobalRewardEstimateValidator {
  return new GlobalRewardEstimateValidator(
    [
      new GlobalRewardEstimateRequiredCodeRule("global reward estimate needs a value"),
      new GlobalRewardEstimateSummaryLengthRule(255),
      new GlobalRewardEstimateCodePrefixRule("Q"),
    ],
  );
}
