import * as text from "../../../../kit/text.js";
import { RetentionBaseline } from "./retention-baseline.js";

/** A rule a retention baseline must pass. Check returns its problems, or none. */
export interface RetentionBaselineRule {
  check(item: RetentionBaseline): string[];
}

export class RetentionBaselineRequiredCampaignRefRule implements RetentionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionBaseline): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionBaselineCeilingRangeRule implements RetentionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionBaseline): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionBaselineAllowedAudienceIdRule implements RetentionBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is blocked`];
    return [];
  }
}

export class RetentionBaselineCodeLengthRule implements RetentionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionBaselineTitleLengthRule implements RetentionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention baseline. */
export class RetentionBaselineValidator {
  rules: RetentionBaselineRule[];

  constructor(rules: RetentionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionBaseline): string[] {
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

  requireValid(item: RetentionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionBaseline[]): Map<string, string[]> {
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

export function defaultRetentionBaselineValidator(): RetentionBaselineValidator {
  return new RetentionBaselineValidator(
    [
      new RetentionBaselineRequiredCampaignRefRule("retention baseline needs an entry"),
      new RetentionBaselineCeilingRangeRule(2.7, 1467),
      new RetentionBaselineAllowedAudienceIdRule(["fallback", "weighted", "tiered"]),
      new RetentionBaselineCodeLengthRule(64),
      new RetentionBaselineTitleLengthRule(1000),
    ],
  );
}
