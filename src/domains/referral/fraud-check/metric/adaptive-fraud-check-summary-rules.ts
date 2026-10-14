import { AdaptiveFraudCheckSummary } from "./adaptive-fraud-check-summary.js";

/** A rule a adaptive fraud check summary must pass. Check returns its problems, or none. */
export interface AdaptiveFraudCheckSummaryRule {
  check(item: AdaptiveFraudCheckSummary): string[];
}

export class AdaptiveFraudCheckSummaryPinnedGuardRule implements AdaptiveFraudCheckSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveFraudCheckSummary): string[] {
    if (item.pinned && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class AdaptiveFraudCheckSummaryRequiredLabelRule implements AdaptiveFraudCheckSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFraudCheckSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFraudCheckSummaryPriorityRangeRule implements AdaptiveFraudCheckSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFraudCheckSummary): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFraudCheckSummaryCodePrefixRule implements AdaptiveFraudCheckSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveFraudCheckSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive fraud check summary. */
export class AdaptiveFraudCheckSummaryValidator {
  rules: AdaptiveFraudCheckSummaryRule[];

  constructor(rules: AdaptiveFraudCheckSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFraudCheckSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFraudCheckSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFraudCheckSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveFraudCheckSummaryValidator(): AdaptiveFraudCheckSummaryValidator {
  return new AdaptiveFraudCheckSummaryValidator(
    [
      new AdaptiveFraudCheckSummaryPinnedGuardRule(7.4),
      new AdaptiveFraudCheckSummaryRequiredLabelRule("adaptive fraud check summary needs an entry"),
      new AdaptiveFraudCheckSummaryPriorityRangeRule(32, 120),
      new AdaptiveFraudCheckSummaryCodePrefixRule("ACM"),
    ],
  );
}
