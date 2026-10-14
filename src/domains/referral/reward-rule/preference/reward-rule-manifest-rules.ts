import { RewardRuleManifest } from "./reward-rule-manifest.js";

/** A rule a reward rule manifest must pass. Check returns its problems, or none. */
export interface RewardRuleManifestRule {
  check(item: RewardRuleManifest): string[];
}

export class RewardRuleManifestRequiredLabelRule implements RewardRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleManifestCodePrefixRule implements RewardRuleManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleManifestCurrencyLengthRule implements RewardRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleManifest): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleManifestContactEmailLengthRule implements RewardRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleManifest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleManifestThresholdRangeRule implements RewardRuleManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleManifest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward rule manifest. */
export class RewardRuleManifestValidator {
  rules: RewardRuleManifestRule[];

  constructor(rules: RewardRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleManifest): string[] {
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

  requireValid(item: RewardRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleManifest[]): Map<string, string[]> {
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

export function defaultRewardRuleManifestValidator(): RewardRuleManifestValidator {
  return new RewardRuleManifestValidator(
    [
      new RewardRuleManifestRequiredLabelRule("reward rule manifest needs an entry"),
      new RewardRuleManifestCodePrefixRule("X"),
      new RewardRuleManifestCurrencyLengthRule(3600),
      new RewardRuleManifestContactEmailLengthRule(1000),
      new RewardRuleManifestThresholdRangeRule(2.9, 687.4),
    ],
  );
}
