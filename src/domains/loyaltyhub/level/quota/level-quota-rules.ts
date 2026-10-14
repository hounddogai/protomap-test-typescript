import { LevelQuota } from "./level-quota.js";

/** A rule a level quota must pass. Check returns its problems, or none. */
export interface LevelQuotaRule {
  check(item: LevelQuota): string[];
}

export class LevelQuotaRequiredLocaleRule implements LevelQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelQuota): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LevelQuotaRevisionRangeRule implements LevelQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelQuota): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelQuotaRequiredCodeRule implements LevelQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelQuotaCampaignRefLengthRule implements LevelQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelQuota): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level quota. */
export class LevelQuotaValidator {
  rules: LevelQuotaRule[];

  constructor(rules: LevelQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: LevelQuota): string[] {
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

  requireValid(item: LevelQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelQuota[]): Map<string, string[]> {
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

export function defaultLevelQuotaValidator(): LevelQuotaValidator {
  return new LevelQuotaValidator(
    [
      new LevelQuotaRequiredLocaleRule("level quota needs an entry"),
      new LevelQuotaRevisionRangeRule(80, 120),
      new LevelQuotaRequiredCodeRule("level quota needs this field"),
      new LevelQuotaCampaignRefLengthRule(80),
    ],
  );
}
