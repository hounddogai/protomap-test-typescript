import { AdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

/** A rule a adaptive redemption summary must pass. Check returns its problems, or none. */
export interface AdaptiveRedemptionSummaryRule {
  check(item: AdaptiveRedemptionSummary): string[];
}

export class AdaptiveRedemptionSummaryTitleLengthRule implements AdaptiveRedemptionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRedemptionSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRedemptionSummaryCodePrefixRule implements AdaptiveRedemptionSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveRedemptionSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveRedemptionSummaryCodeLengthRule implements AdaptiveRedemptionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRedemptionSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive redemption summary. */
export class AdaptiveRedemptionSummaryValidator {
  rules: AdaptiveRedemptionSummaryRule[];

  constructor(rules: AdaptiveRedemptionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRedemptionSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveRedemptionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRedemptionSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveRedemptionSummaryValidator(): AdaptiveRedemptionSummaryValidator {
  return new AdaptiveRedemptionSummaryValidator(
    [
      new AdaptiveRedemptionSummaryTitleLengthRule(16),
      new AdaptiveRedemptionSummaryCodePrefixRule("OPS"),
      new AdaptiveRedemptionSummaryCodeLengthRule(1000),
    ],
  );
}
