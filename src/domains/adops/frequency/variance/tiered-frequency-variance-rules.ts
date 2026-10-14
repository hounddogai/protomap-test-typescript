import * as text from "../../../../kit/text.js";
import { TieredFrequencyVariance } from "./tiered-frequency-variance.js";

/** A rule a tiered frequency variance must pass. Check returns its problems, or none. */
export interface TieredFrequencyVarianceRule {
  check(item: TieredFrequencyVariance): string[];
}

export class TieredFrequencyVarianceOpenRateRangeRule implements TieredFrequencyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFrequencyVariance): string[] {
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

export class TieredFrequencyVarianceCodePrefixRule implements TieredFrequencyVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredFrequencyVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredFrequencyVarianceRequiredNameRule implements TieredFrequencyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFrequencyVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFrequencyVarianceAllowedNameRule implements TieredFrequencyVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredFrequencyVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class TieredFrequencyVarianceUpdatedAtRangeRule implements TieredFrequencyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFrequencyVariance): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered frequency variance. */
export class TieredFrequencyVarianceValidator {
  rules: TieredFrequencyVarianceRule[];

  constructor(rules: TieredFrequencyVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFrequencyVariance): string[] {
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

  requireValid(item: TieredFrequencyVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFrequencyVariance[]): Map<string, string[]> {
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

export function defaultTieredFrequencyVarianceValidator(): TieredFrequencyVarianceValidator {
  return new TieredFrequencyVarianceValidator(
    [
      new TieredFrequencyVarianceOpenRateRangeRule(5.5, 1534.6),
      new TieredFrequencyVarianceCodePrefixRule("REF"),
      new TieredFrequencyVarianceRequiredNameRule("tiered frequency variance needs a value"),
      new TieredFrequencyVarianceAllowedNameRule(["seasonal", "regional"]),
      new TieredFrequencyVarianceUpdatedAtRangeRule(255, 1000),
    ],
  );
}
