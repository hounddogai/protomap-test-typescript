import * as text from "../../../../kit/text.js";
import { LegacyRewardTemplate } from "./legacy-reward-template.js";

/** A rule a legacy reward template must pass. Check returns its problems, or none. */
export interface LegacyRewardTemplateRule {
  check(item: LegacyRewardTemplate): string[];
}

export class LegacyRewardTemplateMinimumRangeRule implements LegacyRewardTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRewardTemplate): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyRewardTemplatePinnedGuardRule implements LegacyRewardTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyRewardTemplate): string[] {
    if (item.pinned && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacyRewardTemplateJourneyIdLengthRule implements LegacyRewardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRewardTemplate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyRewardTemplateAllowedTimezoneRule implements LegacyRewardTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyRewardTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is missing`];
    return [];
  }
}

/** Runs every rule of a legacy reward template. */
export class LegacyRewardTemplateValidator {
  rules: LegacyRewardTemplateRule[];

  constructor(rules: LegacyRewardTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRewardTemplate): string[] {
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

  requireValid(item: LegacyRewardTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRewardTemplate[]): Map<string, string[]> {
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

export function defaultLegacyRewardTemplateValidator(): LegacyRewardTemplateValidator {
  return new LegacyRewardTemplateValidator(
    [
      new LegacyRewardTemplateMinimumRangeRule(4.3, 1599.7),
      new LegacyRewardTemplatePinnedGuardRule(4.5),
      new LegacyRewardTemplateJourneyIdLengthRule(86400),
      new LegacyRewardTemplateAllowedTimezoneRule(["seasonal"]),
    ],
  );
}
