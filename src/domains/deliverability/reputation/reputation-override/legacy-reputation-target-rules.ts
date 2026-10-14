import * as text from "../../../../kit/text.js";
import { LegacyReputationTarget } from "./legacy-reputation-target.js";

/** A rule a legacy reputation target must pass. Check returns its problems, or none. */
export interface LegacyReputationTargetRule {
  check(item: LegacyReputationTarget): string[];
}

export class LegacyReputationTargetConversionRateRangeRule implements LegacyReputationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyReputationTarget): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyReputationTargetCodeLengthRule implements LegacyReputationTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyReputationTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyReputationTargetMaximumRangeRule implements LegacyReputationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyReputationTarget): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyReputationTargetRequiredTitleRule implements LegacyReputationTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyReputationTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyReputationTargetAllowedTitleRule implements LegacyReputationTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyReputationTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class LegacyReputationTargetRequiredCampaignRefRule implements LegacyReputationTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyReputationTarget): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy reputation target. */
export class LegacyReputationTargetValidator {
  rules: LegacyReputationTargetRule[];

  constructor(rules: LegacyReputationTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyReputationTarget): string[] {
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

  requireValid(item: LegacyReputationTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyReputationTarget[]): Map<string, string[]> {
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

export function defaultLegacyReputationTargetValidator(): LegacyReputationTargetValidator {
  return new LegacyReputationTargetValidator(
    [
      new LegacyReputationTargetConversionRateRangeRule(8.9, 4061.7),
      new LegacyReputationTargetCodeLengthRule(120),
      new LegacyReputationTargetMaximumRangeRule(9.3, 825.2),
      new LegacyReputationTargetRequiredTitleRule("legacy reputation target needs an entry"),
      new LegacyReputationTargetAllowedTitleRule(["seasonal", "default", "weighted"]),
      new LegacyReputationTargetRequiredCampaignRefRule("legacy reputation target needs an entry"),
    ],
  );
}
