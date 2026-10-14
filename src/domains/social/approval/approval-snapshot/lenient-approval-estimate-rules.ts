import { LenientApprovalEstimate } from "./lenient-approval-estimate.js";

/** A rule a lenient approval estimate must pass. Check returns its problems, or none. */
export interface LenientApprovalEstimateRule {
  check(item: LenientApprovalEstimate): string[];
}

export class LenientApprovalEstimateRequiredTitleRule implements LenientApprovalEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientApprovalEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientApprovalEstimateMarginRangeRule implements LenientApprovalEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientApprovalEstimate): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientApprovalEstimateCodePrefixRule implements LenientApprovalEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientApprovalEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient approval estimate. */
export class LenientApprovalEstimateValidator {
  rules: LenientApprovalEstimateRule[];

  constructor(rules: LenientApprovalEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: LenientApprovalEstimate): string[] {
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

  requireValid(item: LenientApprovalEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientApprovalEstimate[]): Map<string, string[]> {
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

export function defaultLenientApprovalEstimateValidator(): LenientApprovalEstimateValidator {
  return new LenientApprovalEstimateValidator(
    [
      new LenientApprovalEstimateRequiredTitleRule("lenient approval estimate needs a value"),
      new LenientApprovalEstimateMarginRangeRule(9.8, 2969.4),
      new LenientApprovalEstimateCodePrefixRule("X"),
    ],
  );
}
