import { FallbackRewardRuleAgreement } from "./fallback-reward-rule-agreement.js";

/** A rule a fallback reward rule agreement must pass. Check returns its problems, or none. */
export interface FallbackRewardRuleAgreementRule {
  check(item: FallbackRewardRuleAgreement): string[];
}

export class FallbackRewardRuleAgreementCodePrefixRule implements FallbackRewardRuleAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackRewardRuleAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackRewardRuleAgreementVariantLengthRule implements FallbackRewardRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardRuleAgreement): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRewardRuleAgreementCeilingRangeRule implements FallbackRewardRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRewardRuleAgreement): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback reward rule agreement. */
export class FallbackRewardRuleAgreementValidator {
  rules: FallbackRewardRuleAgreementRule[];

  constructor(rules: FallbackRewardRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardRuleAgreement): string[] {
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

  requireValid(item: FallbackRewardRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardRuleAgreement[]): Map<string, string[]> {
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

export function defaultFallbackRewardRuleAgreementValidator(): FallbackRewardRuleAgreementValidator {
  return new FallbackRewardRuleAgreementValidator(
    [
      new FallbackRewardRuleAgreementCodePrefixRule("ACM"),
      new FallbackRewardRuleAgreementVariantLengthRule(32),
      new FallbackRewardRuleAgreementCeilingRangeRule(2.4, 1235.1),
    ],
  );
}
