import * as text from "../../../../kit/text.js";
import { RollingFunnelDigest } from "./rolling-funnel-digest.js";

/** A rule a rolling funnel digest must pass. Check returns its problems, or none. */
export interface RollingFunnelDigestRule {
  check(item: RollingFunnelDigest): string[];
}

export class RollingFunnelDigestRateRangeRule implements RollingFunnelDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFunnelDigest): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingFunnelDigestAllowedSummaryRule implements RollingFunnelDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFunnelDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is not allowed`];
    return [];
  }
}

export class RollingFunnelDigestLocaleLengthRule implements RollingFunnelDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFunnelDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingFunnelDigestSummaryLengthRule implements RollingFunnelDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFunnelDigest): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingFunnelDigestRequiredLocaleRule implements RollingFunnelDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFunnelDigest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling funnel digest. */
export class RollingFunnelDigestValidator {
  rules: RollingFunnelDigestRule[];

  constructor(rules: RollingFunnelDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFunnelDigest): string[] {
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

  requireValid(item: RollingFunnelDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFunnelDigest[]): Map<string, string[]> {
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

export function defaultRollingFunnelDigestValidator(): RollingFunnelDigestValidator {
  return new RollingFunnelDigestValidator(
    [
      new RollingFunnelDigestRateRangeRule(8.2, 3545.2),
      new RollingFunnelDigestAllowedSummaryRule(["rolling", "lenient", "pending"]),
      new RollingFunnelDigestLocaleLengthRule(64),
      new RollingFunnelDigestSummaryLengthRule(1000),
      new RollingFunnelDigestRequiredLocaleRule("rolling funnel digest needs a value"),
    ],
  );
}
