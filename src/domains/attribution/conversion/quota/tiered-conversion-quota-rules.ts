import * as text from "../../../../kit/text.js";
import { TieredConversionQuota } from "./tiered-conversion-quota.js";

/** A rule a tiered conversion quota must pass. Check returns its problems, or none. */
export interface TieredConversionQuotaRule {
  check(item: TieredConversionQuota): string[];
}

export class TieredConversionQuotaRequiredJourneyIdRule implements TieredConversionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredConversionQuota): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredConversionQuotaCodePrefixRule implements TieredConversionQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredConversionQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredConversionQuotaWeightRangeRule implements TieredConversionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredConversionQuota): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredConversionQuotaAllowedChecksumRule implements TieredConversionQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredConversionQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is missing`];
    return [];
  }
}

export class TieredConversionQuotaRequiredCodeRule implements TieredConversionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredConversionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered conversion quota. */
export class TieredConversionQuotaValidator {
  rules: TieredConversionQuotaRule[];

  constructor(rules: TieredConversionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TieredConversionQuota): string[] {
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

  requireValid(item: TieredConversionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredConversionQuota[]): Map<string, string[]> {
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

export function defaultTieredConversionQuotaValidator(): TieredConversionQuotaValidator {
  return new TieredConversionQuotaValidator(
    [
      new TieredConversionQuotaRequiredJourneyIdRule("tiered conversion quota needs this field"),
      new TieredConversionQuotaCodePrefixRule("ACM"),
      new TieredConversionQuotaWeightRangeRule(3.4, 3119.6),
      new TieredConversionQuotaAllowedChecksumRule(["adaptive", "legacy", "legacy"]),
      new TieredConversionQuotaRequiredCodeRule("tiered conversion quota needs this field"),
    ],
  );
}
