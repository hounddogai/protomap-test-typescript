import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleTarget } from "./adaptive-reward-rule-target.js";

/** A rule a adaptive reward rule target must pass. Check returns its problems, or none. */
export interface AdaptiveRewardRuleTargetRule {
  check(item: AdaptiveRewardRuleTarget): string[];
}

export class AdaptiveRewardRuleTargetRequiredCodeRule implements AdaptiveRewardRuleTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRewardRuleTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRewardRuleTargetChannelLengthRule implements AdaptiveRewardRuleTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRewardRuleTarget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRewardRuleTargetRequiredTitleRule implements AdaptiveRewardRuleTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRewardRuleTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRewardRuleTargetAllowedUnitRule implements AdaptiveRewardRuleTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveRewardRuleTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is too long`];
    return [];
  }
}

export class AdaptiveRewardRuleTargetCodeLengthRule implements AdaptiveRewardRuleTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRewardRuleTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRewardRuleTargetImpressionsRangeRule implements AdaptiveRewardRuleTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRewardRuleTarget): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive reward rule target. */
export class AdaptiveRewardRuleTargetValidator {
  rules: AdaptiveRewardRuleTargetRule[];

  constructor(rules: AdaptiveRewardRuleTargetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRewardRuleTarget): string[] {
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

  requireValid(item: AdaptiveRewardRuleTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRewardRuleTarget[]): Map<string, string[]> {
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

export function defaultAdaptiveRewardRuleTargetValidator(): AdaptiveRewardRuleTargetValidator {
  return new AdaptiveRewardRuleTargetValidator(
    [
      new AdaptiveRewardRuleTargetRequiredCodeRule("adaptive reward rule target needs a value"),
      new AdaptiveRewardRuleTargetChannelLengthRule(86400),
      new AdaptiveRewardRuleTargetRequiredTitleRule("adaptive reward rule target needs an entry"),
      new AdaptiveRewardRuleTargetAllowedUnitRule(["capped"]),
      new AdaptiveRewardRuleTargetCodeLengthRule(32),
      new AdaptiveRewardRuleTargetImpressionsRangeRule(16, 1000),
    ],
  );
}
