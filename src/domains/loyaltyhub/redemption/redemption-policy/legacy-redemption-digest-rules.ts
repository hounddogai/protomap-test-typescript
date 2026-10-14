import * as text from "../../../../kit/text.js";
import { LegacyRedemptionDigest } from "./legacy-redemption-digest.js";

/** A rule a legacy redemption digest must pass. Check returns its problems, or none. */
export interface LegacyRedemptionDigestRule {
  check(item: LegacyRedemptionDigest): string[];
}

export class LegacyRedemptionDigestCodeLengthRule implements LegacyRedemptionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyRedemptionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyRedemptionDigestAttemptsRangeRule implements LegacyRedemptionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRedemptionDigest): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyRedemptionDigestImpressionsRangeRule implements LegacyRedemptionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRedemptionDigest): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyRedemptionDigestOpenRateRangeRule implements LegacyRedemptionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyRedemptionDigest): string[] {
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

export class LegacyRedemptionDigestAllowedLabelRule implements LegacyRedemptionDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyRedemptionDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

/** Runs every rule of a legacy redemption digest. */
export class LegacyRedemptionDigestValidator {
  rules: LegacyRedemptionDigestRule[];

  constructor(rules: LegacyRedemptionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyRedemptionDigest): string[] {
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

  requireValid(item: LegacyRedemptionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyRedemptionDigest[]): Map<string, string[]> {
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

export function defaultLegacyRedemptionDigestValidator(): LegacyRedemptionDigestValidator {
  return new LegacyRedemptionDigestValidator(
    [
      new LegacyRedemptionDigestCodeLengthRule(32),
      new LegacyRedemptionDigestAttemptsRangeRule(255, 86400),
      new LegacyRedemptionDigestImpressionsRangeRule(64, 1000),
      new LegacyRedemptionDigestOpenRateRangeRule(2.1, 3705.4),
      new LegacyRedemptionDigestAllowedLabelRule(["tiered"]),
    ],
  );
}
