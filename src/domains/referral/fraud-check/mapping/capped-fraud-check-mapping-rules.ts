import * as text from "../../../../kit/text.js";
import { CappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

/** A rule a capped fraud check mapping must pass. Check returns its problems, or none. */
export interface CappedFraudCheckMappingRule {
  check(item: CappedFraudCheckMapping): string[];
}

export class CappedFraudCheckMappingAllowedCurrencyRule implements CappedFraudCheckMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedFraudCheckMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is blocked`];
    return [];
  }
}

export class CappedFraudCheckMappingCodePrefixRule implements CappedFraudCheckMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedFraudCheckMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedFraudCheckMappingRateRangeRule implements CappedFraudCheckMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFraudCheckMapping): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFraudCheckMappingActiveGuardRule implements CappedFraudCheckMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedFraudCheckMapping): string[] {
    if (item.active && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class CappedFraudCheckMappingChecksumLengthRule implements CappedFraudCheckMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckMapping): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped fraud check mapping. */
export class CappedFraudCheckMappingValidator {
  rules: CappedFraudCheckMappingRule[];

  constructor(rules: CappedFraudCheckMappingRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFraudCheckMapping): string[] {
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

  requireValid(item: CappedFraudCheckMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFraudCheckMapping[]): Map<string, string[]> {
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

export function defaultCappedFraudCheckMappingValidator(): CappedFraudCheckMappingValidator {
  return new CappedFraudCheckMappingValidator(
    [
      new CappedFraudCheckMappingAllowedCurrencyRule(["scheduled", "lenient", "default"]),
      new CappedFraudCheckMappingCodePrefixRule("Q"),
      new CappedFraudCheckMappingRateRangeRule(4.6, 280.6),
      new CappedFraudCheckMappingActiveGuardRule(5.3),
      new CappedFraudCheckMappingChecksumLengthRule(86400),
    ],
  );
}
