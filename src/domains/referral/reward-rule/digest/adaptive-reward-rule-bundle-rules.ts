import { AdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

/** A rule a adaptive reward rule bundle must pass. Check returns its problems, or none. */
export interface AdaptiveRewardRuleBundleRule {
  check(item: AdaptiveRewardRuleBundle): string[];
}

export class AdaptiveRewardRuleBundleOwnerIdLengthRule implements AdaptiveRewardRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRewardRuleBundle): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRewardRuleBundleCodePrefixRule implements AdaptiveRewardRuleBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveRewardRuleBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveRewardRuleBundleThresholdRangeRule implements AdaptiveRewardRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRewardRuleBundle): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveRewardRuleBundleRequiredLabelRule implements AdaptiveRewardRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRewardRuleBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive reward rule bundle. */
export class AdaptiveRewardRuleBundleValidator {
  rules: AdaptiveRewardRuleBundleRule[];

  constructor(rules: AdaptiveRewardRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRewardRuleBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveRewardRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRewardRuleBundle[]): Map<string, string[]> {
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

export function defaultAdaptiveRewardRuleBundleValidator(): AdaptiveRewardRuleBundleValidator {
  return new AdaptiveRewardRuleBundleValidator(
    [
      new AdaptiveRewardRuleBundleOwnerIdLengthRule(1000),
      new AdaptiveRewardRuleBundleCodePrefixRule("OPS"),
      new AdaptiveRewardRuleBundleThresholdRangeRule(2.4, 572.7),
      new AdaptiveRewardRuleBundleRequiredLabelRule("adaptive reward rule bundle needs an entry"),
    ],
  );
}
