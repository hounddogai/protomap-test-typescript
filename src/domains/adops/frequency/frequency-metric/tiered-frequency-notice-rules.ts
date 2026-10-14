import * as text from "../../../../kit/text.js";
import { TieredFrequencyNotice } from "./tiered-frequency-notice.js";

/** A rule a tiered frequency notice must pass. Check returns its problems, or none. */
export interface TieredFrequencyNoticeRule {
  check(item: TieredFrequencyNotice): string[];
}

export class TieredFrequencyNoticeUpdatedAtRangeRule implements TieredFrequencyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFrequencyNotice): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredFrequencyNoticeAllowedCountryRule implements TieredFrequencyNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredFrequencyNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is not allowed`];
    return [];
  }
}

export class TieredFrequencyNoticeApprovedGuardRule implements TieredFrequencyNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredFrequencyNotice): string[] {
    if (item.approved && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TieredFrequencyNoticeRequiredTitleRule implements TieredFrequencyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFrequencyNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFrequencyNoticeRequiredCountryRule implements TieredFrequencyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFrequencyNotice): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFrequencyNoticeMinimumRangeRule implements TieredFrequencyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFrequencyNotice): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered frequency notice. */
export class TieredFrequencyNoticeValidator {
  rules: TieredFrequencyNoticeRule[];

  constructor(rules: TieredFrequencyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFrequencyNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFrequencyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFrequencyNotice[]): Map<string, string[]> {
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

export function defaultTieredFrequencyNoticeValidator(): TieredFrequencyNoticeValidator {
  return new TieredFrequencyNoticeValidator(
    [
      new TieredFrequencyNoticeUpdatedAtRangeRule(16, 120),
      new TieredFrequencyNoticeAllowedCountryRule(["default", "fallback", "tiered"]),
      new TieredFrequencyNoticeApprovedGuardRule(3600),
      new TieredFrequencyNoticeRequiredTitleRule("tiered frequency notice needs an entry"),
      new TieredFrequencyNoticeRequiredCountryRule("tiered frequency notice needs a value"),
      new TieredFrequencyNoticeMinimumRangeRule(1, 2617.9),
    ],
  );
}
