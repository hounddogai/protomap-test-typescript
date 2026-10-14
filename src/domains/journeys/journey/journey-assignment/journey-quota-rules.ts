import * as text from "../../../../kit/text.js";
import { JourneyQuota } from "./journey-quota.js";

/** A rule a journey quota must pass. Check returns its problems, or none. */
export interface JourneyQuotaRule {
  check(item: JourneyQuota): string[];
}

export class JourneyQuotaReviewerLengthRule implements JourneyQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyQuota): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyQuotaOpenRateRangeRule implements JourneyQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyQuota): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyQuotaAllowedReviewerRule implements JourneyQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is not allowed`];
    return [];
  }
}

export class JourneyQuotaArchivedGuardRule implements JourneyQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: JourneyQuota): string[] {
    if (item.archived && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class JourneyQuotaCodePrefixRule implements JourneyQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a journey quota. */
export class JourneyQuotaValidator {
  rules: JourneyQuotaRule[];

  constructor(rules: JourneyQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyQuota): string[] {
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

  requireValid(item: JourneyQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyQuota[]): Map<string, string[]> {
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

export function defaultJourneyQuotaValidator(): JourneyQuotaValidator {
  return new JourneyQuotaValidator(
    [
      new JourneyQuotaReviewerLengthRule(255),
      new JourneyQuotaOpenRateRangeRule(9.2, 941.6),
      new JourneyQuotaAllowedReviewerRule(["regional", "regional", "seasonal"]),
      new JourneyQuotaArchivedGuardRule(4.1),
      new JourneyQuotaCodePrefixRule("Q"),
    ],
  );
}
