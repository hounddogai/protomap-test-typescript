import { CappedRewardSummary } from "./capped-reward-summary.js";

/** A rule a capped reward summary must pass. Check returns its problems, or none. */
export interface CappedRewardSummaryRule {
  check(item: CappedRewardSummary): string[];
}

export class CappedRewardSummaryRequiredSummaryRule implements CappedRewardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRewardSummary): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRewardSummaryCodePrefixRule implements CappedRewardSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedRewardSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedRewardSummaryLabelLengthRule implements CappedRewardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRewardSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped reward summary. */
export class CappedRewardSummaryValidator {
  rules: CappedRewardSummaryRule[];

  constructor(rules: CappedRewardSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRewardSummary): string[] {
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

  requireValid(item: CappedRewardSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRewardSummary[]): Map<string, string[]> {
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

export function defaultCappedRewardSummaryValidator(): CappedRewardSummaryValidator {
  return new CappedRewardSummaryValidator(
    [
      new CappedRewardSummaryRequiredSummaryRule("capped reward summary needs an entry"),
      new CappedRewardSummaryCodePrefixRule("ACM"),
      new CappedRewardSummaryLabelLengthRule(255),
    ],
  );
}
