import { AdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

/** A rule a adaptive reward rule summary must pass. Check returns its problems, or none. */
export interface AdaptiveRewardRuleSummaryRule {
  check(item: AdaptiveRewardRuleSummary): string[];
}

export class AdaptiveRewardRuleSummaryCodePrefixRule implements AdaptiveRewardRuleSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveRewardRuleSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveRewardRuleSummaryRequiredNameRule implements AdaptiveRewardRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRewardRuleSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRewardRuleSummaryTimezoneLengthRule implements AdaptiveRewardRuleSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRewardRuleSummary): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive reward rule summary. */
export class AdaptiveRewardRuleSummaryValidator {
  rules: AdaptiveRewardRuleSummaryRule[];

  constructor(rules: AdaptiveRewardRuleSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRewardRuleSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveRewardRuleSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRewardRuleSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveRewardRuleSummaryValidator(): AdaptiveRewardRuleSummaryValidator {
  return new AdaptiveRewardRuleSummaryValidator(
    [
      new AdaptiveRewardRuleSummaryCodePrefixRule("OPS"),
      new AdaptiveRewardRuleSummaryRequiredNameRule("adaptive reward rule summary needs this field"),
      new AdaptiveRewardRuleSummaryTimezoneLengthRule(64),
    ],
  );
}
