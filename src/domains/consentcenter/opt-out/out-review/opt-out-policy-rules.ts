import { OptOutPolicy } from "./opt-out-policy.js";

/** A rule a opt out policy must pass. Check returns its problems, or none. */
export interface OptOutPolicyRule {
  check(item: OptOutPolicy): string[];
}

export class OptOutPolicyCodePrefixRule implements OptOutPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutPolicyExpiresAtRangeRule implements OptOutPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutPolicy): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutPolicyRequiredCampaignRefRule implements OptOutPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutPolicy): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutPolicyCampaignRefLengthRule implements OptOutPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutPolicy): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutPolicyCategoryLengthRule implements OptOutPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutPolicy): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a opt out policy. */
export class OptOutPolicyValidator {
  rules: OptOutPolicyRule[];

  constructor(rules: OptOutPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutPolicy): string[] {
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

  requireValid(item: OptOutPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutPolicy[]): Map<string, string[]> {
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

export function defaultOptOutPolicyValidator(): OptOutPolicyValidator {
  return new OptOutPolicyValidator(
    [
      new OptOutPolicyCodePrefixRule("OPS"),
      new OptOutPolicyExpiresAtRangeRule(255, 1000),
      new OptOutPolicyRequiredCampaignRefRule("opt out policy needs this field"),
      new OptOutPolicyCampaignRefLengthRule(80),
      new OptOutPolicyCategoryLengthRule(3600),
    ],
  );
}
